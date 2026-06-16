const http = require("node:http");

const PORT = Number(process.env.AI_SERVER_PORT || 3001);
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 6;
const MAX_HISTORY_POINTS = 20;

const rateLimitBuckets = new Map();

function getEnv(name, fallback = "") {
  const value = process.env[name];
  return typeof value === "string" ? value : fallback;
}

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, x-rate-limit-key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  });
  res.end(JSON.stringify(payload));
}

function readRateKey(req) {
  const key = String(req.headers["x-rate-limit-key"] ?? "anonymous").trim();
  return key.slice(0, 120) || "anonymous";
}

function isRateLimited(rateKey) {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(rateKey);

  if (!bucket || now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitBuckets.set(rateKey, { windowStart: now, count: 1 });
    return false;
  }

  bucket.count += 1;
  rateLimitBuckets.set(rateKey, bucket);
  return bucket.count > RATE_LIMIT_MAX_REQUESTS;
}

function asFiniteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sanitizePayload(body) {
  const history = (Array.isArray(body?.history) ? body.history : [])
    .map((value) => asFiniteNumber(value, NaN))
    .filter((value) => Number.isFinite(value))
    .slice(0, MAX_HISTORY_POINTS);

  if (history.length < 5) {
    throw new Error("Sao necessarios pelo menos 5 pontos no historico.");
  }

  return {
    type: String(body?.type ?? "").slice(0, 40),
    endpoint: String(body?.endpoint ?? "").slice(0, 40),
    currentValue: asFiniteNumber(body?.currentValue, 0),
    history,
    min: asFiniteNumber(body?.min, 0),
    max: asFiniteNumber(body?.max, 0),
    unit: String(body?.unit ?? "").slice(0, 20),
    timestamp: String(body?.timestamp ?? new Date().toISOString()).slice(0, 64),
    expectedRange: {
      label: String(body?.expectedRange?.label ?? "normal").slice(0, 40),
      min: asFiniteNumber(body?.expectedRange?.min, 0),
      max: asFiniteNumber(body?.expectedRange?.max, 0),
    },
  };
}

function stripJsonFences(value) {
  const text = String(value ?? "").trim();
  if (!text.startsWith("```")) return text;
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function normalizeTrend(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "subir") return "subir";
  if (raw === "descer") return "descer";
  if (raw === "estavel" || raw === "estável") return "estavel";
  return "estavel";
}

function normalizeRiskLevel(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "alto") return "alto";
  if (raw === "moderado") return "moderado";
  return "baixo";
}

function normalizeInsight(candidate) {
  const summary = String(candidate?.summary ?? "").trim();
  const actions = Array.isArray(candidate?.actions)
    ? candidate.actions
        .map((action) => String(action ?? "").trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];

  return {
    summary:
      summary ||
      "Leitura indisponivel neste momento. Volte a tentar com mais dados.",
    trend: normalizeTrend(candidate?.trend),
    riskLevel: normalizeRiskLevel(candidate?.riskLevel),
    actions:
      actions.length > 0
        ? actions
        : ["Continue a registar medicoes para confirmar a tendencia."],
    warning:
      String(candidate?.warning ?? "").trim() ||
      "Isto nao substitui aconselhamento medico profissional.",
  };
}

function buildPrompt(payload) {
  return [
    "Tu es um assistente de saude para leitura de metricas, sem diagnostico.",
    "Responde em pt-PT, curto e claro.",
    "Produz APENAS JSON valido com as chaves exatas:",
    "summary, trend, riskLevel, actions, warning",
    "Regras:",
    "- trend: subir | descer | estavel",
    "- riskLevel: baixo | moderado | alto",
    "- actions: lista de 2 a 3 acoes praticas e seguras",
    "- Nunca incluir diagnosticos, prescricoes, doses, nem alarmismo",
    "- warning deve mencionar que nao substitui aconselhamento medico",
    "",
    "Dados da metrica:",
    JSON.stringify(payload),
  ].join("\n");
}

async function requestGemini(payload) {
  const apiKey = getEnv("GEMINI_API_KEY") || getEnv("AIDE_AI_API_KEY");
  const model = getEnv("GEMINI_MODEL", "gemini-1.5-pro");

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY nao configurada no servidor.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: buildPrompt(payload) }] }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
        maxOutputTokens: 350,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const reason = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${reason}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text ?? "")
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Resposta vazia da Gemini API.");
  }

  const parsed = JSON.parse(stripJsonFences(text));
  return normalizeInsight(parsed);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error("Payload demasiado grande."));
      }
    });

    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    return json(res, 204, {});
  }

  if (!(req.method === "POST" && req.url === "/ai/metric-insight")) {
    return json(res, 404, { error: "Endpoint nao encontrado." });
  }

  const rateKey = readRateKey(req);
  if (isRateLimited(rateKey)) {
    return json(res, 429, {
      error: "Demasiados pedidos de interpretacao. Tenta novamente em 1 minuto.",
    });
  }

  let payload;
  try {
    const body = await readRequestBody(req);
    payload = sanitizePayload(body);
  } catch (error) {
    return json(res, 400, {
      error: error instanceof Error ? error.message : "Payload invalido.",
    });
  }

  try {
    const insight = await requestGemini(payload);
    return json(res, 200, insight);
  } catch (error) {
    console.error("[AI] metric-insight error", error);
    return json(res, 502, {
      error: "Nao foi possivel gerar a interpretacao da IA neste momento.",
    });
  }
});

server.listen(PORT, () => {
  console.log(`[AI] server listening on http://localhost:${PORT}`);
});
