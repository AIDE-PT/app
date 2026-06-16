import Constants from "expo-constants";
import { Platform } from "react-native";

export type MetricExpectedRange = {
  label: string;
  min: number;
  max: number;
};

export type MetricInsightPayload = {
  type: string;
  endpoint: string;
  currentValue: number;
  history: number[];
  min: number;
  max: number;
  unit: string;
  timestamp: string;
  expectedRange: MetricExpectedRange;
};

export type MetricInsightResponse = {
  summary: string;
  trend: "subir" | "descer" | "estavel";
  riskLevel: "baixo" | "moderado" | "alto";
  actions: string[];
  warning: string;
};

type FetchMetricInsightOptions = {
  rateLimitKey?: string;
};

const DEFAULT_AI_PORTS = [3000, 3001];
const MAX_HISTORY_POINTS = 20;

function normalizeBaseUrl(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : null;
}

function isPlaceholderBaseUrl(value: string): boolean {
  return /192\.168\.x\.x|your-machine-ip|example|<.+>|xx?\.xx?/i.test(value);
}

function appendUniqueBase(target: string[], value: string | null) {
  if (!value || isPlaceholderBaseUrl(value) || target.includes(value)) return;
  target.push(value);
}

function appendDerivedPortCandidates(target: string[], value: string | null) {
  if (!value || isPlaceholderBaseUrl(value)) return;

  try {
    const url = new URL(value);
    const protocol = url.protocol || "http:";
    const hostname = url.hostname;

    DEFAULT_AI_PORTS.forEach((port) => {
      appendUniqueBase(target, `${protocol}//${hostname}:${port}`);
    });
  } catch {
    appendUniqueBase(target, value);
  }
}

function resolveDevHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    // Legacy Expo manifest fallback.
    (Constants as any)?.manifest?.debuggerHost ??
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri;

  if (!hostUri || typeof hostUri !== "string") return null;
  const host = hostUri.split(":")[0]?.trim();
  return host && host !== "localhost" && host !== "127.0.0.1" ? host : null;
}

function resolveApiBase(): string {
  const devHost = resolveDevHost();
  const candidates: string[] = [];
  const envBase = normalizeBaseUrl(process.env.EXPO_PUBLIC_AI_API_BASE_URL);

  appendUniqueBase(candidates, envBase);
  appendDerivedPortCandidates(candidates, envBase);

  if (devHost) {
    DEFAULT_AI_PORTS.forEach((port) => {
      appendUniqueBase(candidates, `http://${devHost}:${port}`);
    });
  }

  if (Platform.OS === "android") {
    DEFAULT_AI_PORTS.forEach((port) => {
      appendUniqueBase(candidates, `http://10.0.2.2:${port}`);
    });
  }

  DEFAULT_AI_PORTS.forEach((port) => {
    appendUniqueBase(candidates, `http://localhost:${port}`);
    appendUniqueBase(candidates, `http://127.0.0.1:${port}`);
  });

  return candidates[0] ?? "http://localhost:3000";
}

const API_BASE = resolveApiBase();
const API_BASE_CANDIDATES = (() => {
  const candidates: string[] = [];
  appendUniqueBase(candidates, API_BASE);
  appendDerivedPortCandidates(
    candidates,
    normalizeBaseUrl(process.env.EXPO_PUBLIC_AI_API_BASE_URL),
  );

  DEFAULT_AI_PORTS.forEach((port) => {
    appendUniqueBase(candidates, `http://localhost:${port}`);
    appendUniqueBase(candidates, `http://127.0.0.1:${port}`);
  });

  if (Platform.OS === "android") {
    DEFAULT_AI_PORTS.forEach((port) => {
      appendUniqueBase(candidates, `http://10.0.2.2:${port}`);
    });
  }

  const devHost = resolveDevHost();
  if (devHost) {
    DEFAULT_AI_PORTS.forEach((port) => {
      appendUniqueBase(candidates, `http://${devHost}:${port}`);
    });
  }

  return candidates;
})();

function asFiniteNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sanitizePayload(payload: MetricInsightPayload): MetricInsightPayload {
  const history = (Array.isArray(payload.history) ? payload.history : [])
    .map((value) => asFiniteNumber(value, NaN))
    .filter((value) => Number.isFinite(value))
    .slice(0, MAX_HISTORY_POINTS);

  const currentValue = asFiniteNumber(payload.currentValue, 0);
  const min = asFiniteNumber(payload.min, currentValue);
  const max = asFiniteNumber(payload.max, currentValue);

  return {
    type: String(payload.type ?? ""),
    endpoint: String(payload.endpoint ?? ""),
    currentValue,
    history,
    min,
    max,
    unit: String(payload.unit ?? ""),
    timestamp: String(payload.timestamp ?? new Date().toISOString()),
    expectedRange: {
      label: String(payload.expectedRange?.label ?? "normal"),
      min: asFiniteNumber(payload.expectedRange?.min, min),
      max: asFiniteNumber(payload.expectedRange?.max, max),
    },
  };
}

function normalizeTrend(value: unknown): MetricInsightResponse["trend"] {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "subir") return "subir";
  if (raw === "descer") return "descer";
  return "estavel";
}

function normalizeRisk(value: unknown): MetricInsightResponse["riskLevel"] {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "alto") return "alto";
  if (raw === "moderado") return "moderado";
  return "baixo";
}

function buildNetworkErrorMessage(attemptedBases: string[]): string {
  const attempts = attemptedBases.join(", ");
  return [
    "Nao foi encontrado um endpoint de IA acessivel.",
    `Bases tentadas: ${attempts}.`,
    "Inicia `npm run server` ou define EXPO_PUBLIC_AI_API_BASE_URL para o endereco correto.",
  ].join(" ");
}

export async function fetchMetricInsight(
  payload: MetricInsightPayload,
  options: FetchMetricInsightOptions = {},
): Promise<MetricInsightResponse> {
  const sanitizedPayload = sanitizePayload(payload);
  const attemptedBases: string[] = [];

  for (const baseUrl of API_BASE_CANDIDATES) {
    attemptedBases.push(baseUrl);

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/ai/metric-insight`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(options.rateLimitKey
            ? { "x-rate-limit-key": options.rateLimitKey }
            : {}),
        },
        body: JSON.stringify(sanitizedPayload),
      });
    } catch {
      continue;
    }

    const raw = await response.json().catch(() => ({}));

    if (
      !response.ok &&
      (response.status === 404 || response.status === 405) &&
      attemptedBases.length < API_BASE_CANDIDATES.length
    ) {
      continue;
    }

    if (!response.ok) {
      const message =
        typeof raw?.error === "string"
          ? raw.error
          : "Nao foi possivel obter a interpretacao da IA.";
      throw new Error(message);
    }

    const summary = String(raw?.summary ?? "").trim();
    const actions = Array.isArray(raw?.actions)
      ? raw.actions
          .map((action: unknown) => String(action ?? "").trim())
          .filter(Boolean)
          .slice(0, 3)
      : [];

    return {
      summary:
        summary ||
        "Nao foi possivel gerar um resumo nesta leitura. Tente novamente.",
      trend: normalizeTrend(raw?.trend),
      riskLevel: normalizeRisk(raw?.riskLevel),
      actions:
        actions.length > 0
          ? actions
          : ["Reveja as proximas medicoes para confirmar a tendencia."],
      warning:
        String(raw?.warning ?? "").trim() ||
        "Isto nao substitui aconselhamento medico profissional.",
    };
  }

  throw new Error(buildNetworkErrorMessage(attemptedBases));
}
