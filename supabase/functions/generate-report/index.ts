import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";

type ReportRequest = {
  patientId?: string;
  startDate?: string;
  endDate?: string;
};

type NoteRow = {
  id: string;
  title: string | null;
  content: string | null;
  reference_date: string | null;
  created_at: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const redactPII = (value: string) =>
  value
    .replace(
      /\b[A-ZÀ-Ý][a-zà-ÿ]+(?:\s+[A-ZÀ-Ý][a-zà-ÿ]+){0,2}\b/g,
      "[REDACTED_NAME]",
    )
    .replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, "[REDACTED_EMAIL]")
    .replace(/\b\+?\d[\d\s()-]{7,}\b/g, "[REDACTED_PHONE]");

const parseRequestBody = async (request: Request): Promise<ReportRequest> => {
  try {
    return await request.json();
  } catch {
    return {};
  }
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const groqApiKey = Deno.env.get("GROQ_API_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey || !groqApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Client used only to validate the user's JWT
    const authClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    // Service role client for data queries — bypasses RLS so the report
    // includes all notes for the patient regardless of who created them.
    // Explicit Authorization header ensures the service role key is always
    // sent (Deno has no localStorage session to fall back on).
    const dataClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: { Authorization: `Bearer ${supabaseServiceRoleKey}` },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log("1 - user ok:", user?.id);

    const body = await parseRequestBody(request);
    const { patientId, startDate, endDate } = body;

    if (!patientId || !startDate || !endDate) {
      return new Response(
        JSON.stringify({
          error: "patientId, startDate and endDate are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify the caller is authorized: must be the patient themselves
    // or an aider with an active care_relation to this patient
    if (user.id !== patientId) {
      const { data: relation, error: relationError } = await dataClient
        .from("care_relations")
        .select("id")
        .eq("user_id_pacient", patientId)
        .eq("user_id_aider", user.id)
        .maybeSingle();

      console.log("2a - relation check:", relation, "error:", relationError);

      if (relationError) {
        throw relationError;
      }

      if (!relation) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    console.log("2 - authorized");

    // Fetch all notes for the patient without a strict date filter so that
    // notes with reference_date = null (older notes) are not silently excluded.
    // We apply the date range in JS using created_at as fallback.
    const { data: allNotes, error: notesError } = await dataClient
      .from("notes")
      .select("id, title, content, reference_date, created_at")
      .eq("patient_id", patientId)
      .order("reference_date", { ascending: true, nullsFirst: false });

    if (notesError) {
      throw notesError;
    }

    // Use reference_date when set, fall back to created_at date portion
    const notes = (allNotes ?? []).filter((note: NoteRow) => {
      const effectiveDate = note.reference_date ?? note.created_at.slice(0, 10);
      return effectiveDate >= startDate && effectiveDate <= endDate;
    });

    console.log(
      "3 - allNotes:",
      allNotes?.length,
      "filtered:",
      notes.length,
      "range:",
      startDate,
      "–",
      endDate,
    );

    const sanitizedNotes = (notes ?? []).map((note: NoteRow) => ({
      ...note,
      title: redactPII(String(note.title ?? "")),
      content: redactPII(String(note.content ?? "")),
    }));

    const formattedNotes = sanitizedNotes
      .map((note) => `${note.reference_date}: ${note.title} — ${note.content}`)
      .join("\n");

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                'You are a health assistant. Analyze these caregiver notes and return a structured report in Markdown with 3 sections. Be concise and clinical.\n\nRules:\n- Never use tables\n- Use only bullet points and short paragraphs\n- No introductory text before the first section\n- Output must start directly with ## Resumo de Saúde\n- After ## Resumo de Saúde, add a line saying: "**Notas analisadas: X** (de DD/MM/YYYY a DD/MM/YYYY)"\n- Then add ## Padrões de Alerta and ## Padrões de Bem-estar\n- Always respond in European Portuguese (Portugal, not Brazil)',
            },
            {
              role: "user",
              content:
                formattedNotes ||
                "Sem notas disponíveis para o período selecionado.",
            },
          ],
        }),
      },
    );

    if (!groqResponse.ok) {
      const groqErrorText = await groqResponse.text();
      throw new Error(`Groq request failed: ${groqErrorText}`);
    }
    console.log("4 - groq status:", groqResponse.status);

    const groqData = await groqResponse.json();
    const markdownOutput =
      groqData?.choices?.[0]?.message?.content?.trim() ?? "";

    return new Response(
      JSON.stringify({
        report: markdownOutput,
        noteCount: notes?.length ?? 0,
        patientName: "",
        startDate,
        endDate,
        noteTitles: (notes ?? []).map((note: NoteRow) => ({
          date: note.reference_date ?? "",
          title: note.title ?? `Nota de ${note.reference_date}`,
        })),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error(
      "CATCH:",
      error instanceof Error ? error.message : String(error),
    );
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
