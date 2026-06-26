import { getSupabaseClient } from "./client";

export type Note = {
  id: string;
  patient_id: string;
  creator_id: string;
  title: string;
  content: string;
  reference_date?: string | null;
  created_at: string;
  updated_at: string;
};

export type NoteWithCreator = Note & {
  creator?: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

export type CreateNoteInput = {
  patient_id: string;
  creator_id: string;
  title: string;
  content?: string;
  reference_date?: string;
};

export type UpdateNoteInput = {
  title?: string;
  content?: string;
  reference_date?: string;
};

export async function getNotesByPatient(patient_id: string): Promise<Note[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("notes")
    .select("*")
    .eq("patient_id", patient_id)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getNotesByCreator(creator_id: string): Promise<Note[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("notes")
    .select("*")
    .eq("creator_id", creator_id)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getNoteById(id: string): Promise<Note | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("notes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data;
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("notes")
    .insert({
      patient_id: input.patient_id,
      creator_id: input.creator_id,
      title: input.title || "Sem título",
      content: input.content ?? "",
      reference_date: input.reference_date ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateNote(
  id: string,
  input: UpdateNoteInput,
): Promise<Note> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("notes")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteNote(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from("notes").delete().eq("id", id);

  if (error) throw new Error(error.message);
}

export async function getNotesWithCreator(
  patient_id: string,
): Promise<NoteWithCreator[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("notes")
    .select(
      `
      *,
      creator:users!notes_creator_id_fkey (
        id,
        name,
        email
      )
    `,
    )
    .eq("patient_id", patient_id)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as NoteWithCreator[];
}
