import {
  getHealthConnectStatus,
  readSteps,
  type StepRecord,
} from "@/src/services/healthConnect";
import { supabase } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Platform } from "react-native";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

type ApiMetricRecord = {
  timestamp?: string;
  value?: number;
  systolic?: number;
  diastolic?: number;
};

type MetricQueryData = {
  displayValue: string;
  history: number[];
  latest: ApiMetricRecord;
};

// ─── Supabase fetch ────────────────────────────────────────────────────────────

async function fetchMetricFromSupabaseByTypeNames(
  typeNames: string[],
  isBP: boolean,
): Promise<MetricQueryData | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const patientId = session?.user?.id ?? null;
  if (!patientId) return null;

  const { data: typeRows, error: typeError } = await supabase
    .from("biometric_data_types")
    .select("id,name")
    .in("name", typeNames);

  if (typeError) {
    console.error("[useLatestMetric] type lookup error", typeError);
    return null;
  }

  const typeIds = (Array.isArray(typeRows) ? typeRows : [])
    .map((row: any) => String(row?.id ?? ""))
    .filter(Boolean);

  if (!typeIds.length) return null;

  const { data: rows, error } = await supabase
    .from("biometric_data")
    .select("value,value_secondary,measured_at,created_at")
    .eq("patient_id", patientId)
    .in("biometric_data_type_id", typeIds)
    .order("measured_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[useLatestMetric] metric query error", error);
    return null;
  }

  const dataRows = Array.isArray(rows) ? (rows as any[]) : [];
  if (!dataRows.length) return null;

  const latest = dataRows[0];
  const history = dataRows.map((row) => {
    if (isBP) {
      const sys = Number(row?.value ?? 0);
      const dia = Number(row?.value_secondary ?? 0);
      return Math.round((sys + dia) / 2);
    }
    return Number(row?.value ?? 0);
  });

  return {
    displayValue: isBP
      ? `${latest?.value ?? "--"}/${latest?.value_secondary ?? "--"}`
      : `${latest?.value ?? 0}`,
    history,
    latest: {
      timestamp: latest?.measured_at ?? latest?.created_at ?? undefined,
      value: latest?.value ?? undefined,
      systolic: isBP ? (latest?.value ?? undefined) : undefined,
      diastolic: isBP ? (latest?.value_secondary ?? undefined) : undefined,
    },
  };
}

// ─── Mapeamento endpoint → nomes na BD ────────────────────────────────────────

const TYPE_MAP: Record<string, string[]> = {
  bpm: ["heart_rate", "Batimento Cardíaco"],
  o2: ["oxygen_saturation", "Saturação de Oxigénio"],
  temperature: ["body_temperature", "Temperatura Corporal"],
  stress: ["stress"],
  glycemia: ["glycemia", "Glicemia"],
  bloodPressure: ["blood_pressure", "Pressão Arterial"],
  steps: ["steps"],
  sleep: ["sleep"],
  cal: ["total_calories_burned"],
  calories: ["total_calories_burned"],
};

const BP_ENDPOINTS = new Set(["bloodPressure"]);
const HEALTH_CONNECT_ENDPOINTS = new Set([
  "bpm",
  "steps",
  "bloodPressure",
  "temperature",
  "sleep",
  "o2",
  "cal",
  "calories",
  "glycemia",
  "stress",
]);

function minutesToHoursValue(value: unknown) {
  const minutes = Number(value ?? 0);
  if (!Number.isFinite(minutes)) return 0;
  return minutes / 60;
}

function formatHours(hours: number) {
  if (!Number.isFinite(hours) || hours <= 0) return "--";
  return hours < 10 ? hours.toFixed(1) : `${Math.round(hours)}`;
}

function mapMetricToHours(
  metric: MetricQueryData | null,
): MetricQueryData | null {
  if (!metric) return null;
  const latestHours = minutesToHoursValue(metric.latest?.value);
  return {
    ...metric,
    displayValue: formatHours(latestHours),
    history: metric.history.map((v) => {
      const hours = minutesToHoursValue(v);
      return Math.round(hours * 10) / 10;
    }),
    latest: { ...metric.latest, value: latestHours },
  };
}

// ─── Steps (Health Connect) ───────────────────────────────────────────────────

type HealthConnectFallbackRecord = {
  startTime: number;
  endTime: number;
  count: number;
  sourceApp?: string | null;
};

function getDayWindow(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + DAY_MS);
  return { startMs: start.getTime(), endMs: end.getTime() };
}

function aggregateStepsByHour(
  records: (StepRecord | HealthConnectFallbackRecord)[],
  startMs: number,
  endMs: number,
) {
  const buckets = Array.from({ length: 24 }, () => 0);

  records.forEach((record) => {
    const recordStart = Math.max(record.startTime, startMs);
    const recordEnd = Math.min(record.endTime, endMs);

    if (recordEnd <= recordStart || record.count <= 0) return;

    const durationMs = Math.max(recordEnd - recordStart, 1);

    for (let hourIndex = 0; hourIndex < 24; hourIndex += 1) {
      const bucketStart = startMs + hourIndex * HOUR_MS;
      const bucketEnd = bucketStart + HOUR_MS;
      const overlap =
        Math.min(recordEnd, bucketEnd) - Math.max(recordStart, bucketStart);

      if (overlap > 0) {
        buckets[hourIndex] += record.count * (overlap / durationMs);
      }
    }
  });

  return buckets.map((value) => Math.max(0, Math.round(value)));
}

async function fetchStepsFromSupabaseDaily(): Promise<MetricQueryData | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const patientId = session?.user?.id ?? null;
  if (!patientId) return null;

  const { data: typeRow, error: typeError } = await supabase
    .from("biometric_data_types")
    .select("id")
    .eq("name", "steps")
    .maybeSingle();

  if (typeError) {
    console.error("[useLatestMetric] steps type lookup error", typeError);
    return null;
  }

  if (!typeRow?.id) return null;

  const { startMs, endMs } = getDayWindow(new Date());
  const startIso = new Date(startMs).toISOString();
  const endIso = new Date(endMs).toISOString();

  const { data: rows, error } = await supabase
    .from("biometric_data")
    .select("value,start_time,end_time,measured_at,created_at,source_app")
    .eq("patient_id", patientId)
    .eq("biometric_data_type_id", typeRow.id)
    .lt("start_time", endIso)
    .gt("end_time", startIso)
    .order("start_time", { ascending: true, nullsFirst: false })
    .order("measured_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[useLatestMetric] steps query error", error);
    return null;
  }

  const dataRows = Array.isArray(rows) ? (rows as any[]) : [];
  if (!dataRows.length) return null;

  const records: HealthConnectFallbackRecord[] = dataRows
    .map((row) => {
      const startRaw = row?.start_time ?? row?.measured_at ?? row?.created_at;
      const endRaw = row?.end_time ?? row?.measured_at ?? row?.created_at;
      const startTime = new Date(String(startRaw ?? "")).getTime();
      const endTime = new Date(String(endRaw ?? "")).getTime();
      const count = Number(row?.value ?? 0);
      const sourceApp = row?.source_app == null ? null : String(row.source_app);
      return { startTime, endTime, count, sourceApp };
    })
    .filter(
      (record) =>
        Number.isFinite(record.startTime) &&
        Number.isFinite(record.endTime) &&
        record.endTime > record.startTime &&
        Number.isFinite(record.count) &&
        record.count > 0,
    );

  if (!records.length) return null;

  const SHORT_WINDOW_MAX_MS = DAY_MS;
  const shortWindowRecords = records.filter(
    (record) => record.endTime - record.startTime <= SHORT_WINDOW_MAX_MS,
  );
  const recordsToAggregate = shortWindowRecords.length
    ? shortWindowRecords
    : [...records].sort((a, b) => b.endTime - a.endTime).slice(0, 1);

  const hourly = aggregateStepsByHour(recordsToAggregate, startMs, endMs);
  const totalSteps = hourly.reduce((sum, value) => sum + value, 0);

  return {
    displayValue: `${totalSteps}`,
    history: [...hourly].reverse(),
    latest: { timestamp: new Date().toISOString(), value: totalSteps },
  };
}

async function readStepsWithLibraryFallback(
  startMs: number,
  endMs: number,
): Promise<HealthConnectFallbackRecord[] | null> {
  try {
    const healthConnect = require("react-native-health-connect") as {
      initialize?: () => Promise<boolean>;
      readRecords?: (
        recordType: string,
        options: {
          timeRangeFilter: {
            operator: "between";
            startTime: string;
            endTime: string;
          };
          ascendingOrder: boolean;
        },
      ) => Promise<{ records?: Record<string, unknown>[] }>;
    };

    if (
      typeof healthConnect.initialize !== "function" ||
      typeof healthConnect.readRecords !== "function"
    ) {
      return null;
    }

    const initialized = await healthConnect.initialize();
    if (!initialized) return null;

    const result = await healthConnect.readRecords("Steps", {
      timeRangeFilter: {
        operator: "between",
        startTime: new Date(startMs).toISOString(),
        endTime: new Date(endMs).toISOString(),
      },
      ascendingOrder: true,
    });

    const records = Array.isArray(result.records) ? result.records : [];
    const parsed = records
      .map((record) => {
        const startRaw = record.startTime;
        const endRaw = record.endTime;
        const countRaw = record.count;

        const startTime =
          typeof startRaw === "number"
            ? startRaw
            : new Date(String(startRaw ?? "")).getTime();
        const endTime =
          typeof endRaw === "number"
            ? endRaw
            : new Date(String(endRaw ?? "")).getTime();
        const count = Number(countRaw ?? 0);

        return { startTime, endTime, count };
      })
      .filter(
        (record) =>
          Number.isFinite(record.startTime) &&
          Number.isFinite(record.endTime) &&
          Number.isFinite(record.count) &&
          record.count > 0,
      );

    console.log("[StepsWidget] fallback records", {
      recordsCount: parsed.length,
    });
    return parsed;
  } catch (error) {
    console.log("[StepsWidget] fallback error", error);
    return null;
  }
}

async function fetchHealthConnectStepsDaily(): Promise<MetricQueryData | null> {
  if (Platform.OS !== "android") return null;

  try {
    const status = await getHealthConnectStatus();
    if (!status.available || !status.permissionsGranted) return null;

    const { startMs, endMs } = getDayWindow(new Date());
    let records: (StepRecord | HealthConnectFallbackRecord)[] = [];

    try {
      records = await readSteps(startMs, endMs);
      console.log("[StepsWidget] native bridge records", {
        recordsCount: records.length,
      });
    } catch (nativeError) {
      console.log("[StepsWidget] native bridge readSteps failed", nativeError);
    }

    if (!records.length) {
      const fallbackRecords = await readStepsWithLibraryFallback(
        startMs,
        endMs,
      );
      if (fallbackRecords?.length) records = fallbackRecords;
    }

    const hourly = aggregateStepsByHour(records, startMs, endMs);
    const totalSteps = hourly.reduce((sum, value) => sum + value, 0);

    console.log("[StepsWidget] final daily aggregate", {
      totalSteps,
      hourlyLength: hourly.length,
      hourlyPreview: hourly.slice(0, 6),
    });

    return {
      displayValue: `${totalSteps}`,
      history: [...hourly].reverse(),
      latest: { timestamp: new Date().toISOString(), value: totalSteps },
    };
  } catch (error) {
    console.log(
      "[StepsWidget] fetchHealthConnectStepsDaily fatal error",
      error,
    );
    return null;
  }
}

type HealthConnectRecord = Record<string, any>;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toEpochMs(value: unknown): number {
  if (typeof value === "number") return value;
  return new Date(String(value ?? "")).getTime();
}

function asFiniteNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function ensureNonEmptyHistory(
  values: number[],
  fallbackValue: number,
): number[] {
  if (values.length) return values;
  return Number.isFinite(fallbackValue) ? [fallbackValue] : [];
}

async function readHealthConnectRecords(
  recordType: string,
  startMs: number,
  endMs: number,
): Promise<HealthConnectRecord[] | null> {
  try {
    const healthConnect = require("react-native-health-connect") as {
      initialize?: () => Promise<boolean>;
      readRecords?: (
        type: string,
        options: {
          timeRangeFilter: {
            operator: "between";
            startTime: string;
            endTime: string;
          };
          ascendingOrder: boolean;
        },
      ) => Promise<{ records?: HealthConnectRecord[] }>;
    };

    if (
      typeof healthConnect.initialize !== "function" ||
      typeof healthConnect.readRecords !== "function"
    ) {
      return null;
    }

    const initialized = await healthConnect.initialize();
    if (!initialized) return null;

    const result = await healthConnect.readRecords(recordType, {
      timeRangeFilter: {
        operator: "between",
        startTime: new Date(startMs).toISOString(),
        endTime: new Date(endMs).toISOString(),
      },
      ascendingOrder: true,
    });

    return Array.isArray(result.records) ? result.records : [];
  } catch (error) {
    console.log(
      `[useLatestMetric] readHealthConnectRecords(${recordType}) failed`,
      error,
    );
    return null;
  }
}

function mapBpmToStressScore(bpm: number): number {
  return clamp(Math.round((bpm - 45) * 1.2), 0, 100);
}

async function fetchHealthConnectMetricDaily(
  endpoint: string,
): Promise<MetricQueryData | null> {
  if (Platform.OS !== "android") return null;

  try {
    const status = await getHealthConnectStatus();
    if (!status.available || !status.permissionsGranted) return null;

    const { startMs, endMs } = getDayWindow(new Date());

    if (endpoint === "bpm") {
      const records = await readHealthConnectRecords(
        "HeartRate",
        startMs,
        endMs,
      );
      if (!records?.length) return null;

      const samples = records.flatMap((record) =>
        Array.isArray(record?.samples) ? record.samples : [],
      );
      const values = samples
        .map((sample) => asFiniteNumber(sample?.beatsPerMinute))
        .filter((value): value is number => value != null)
        .map((value) => Math.round(value));
      if (!values.length) return null;

      const latest = values[values.length - 1];
      return {
        displayValue: `${latest}`,
        history: ensureNonEmptyHistory(values.slice(-24), latest),
        latest: { timestamp: new Date().toISOString(), value: latest },
      };
    }

    if (endpoint === "bloodPressure") {
      const records = await readHealthConnectRecords(
        "BloodPressure",
        startMs,
        endMs,
      );
      if (!records?.length) return null;

      const pairs = records
        .map((record) => {
          const systolic = asFiniteNumber(
            record?.systolic?.inMillimetersOfMercury,
          );
          const diastolic = asFiniteNumber(
            record?.diastolic?.inMillimetersOfMercury,
          );
          if (systolic == null || diastolic == null) return null;
          return {
            systolic: Math.round(systolic),
            diastolic: Math.round(diastolic),
          };
        })
        .filter(
          (
            pair,
          ): pair is {
            systolic: number;
            diastolic: number;
          } => pair != null,
        );

      if (!pairs.length) return null;
      const latestPair = pairs[pairs.length - 1];

      return {
        displayValue: `${latestPair.systolic}/${latestPair.diastolic}`,
        history: ensureNonEmptyHistory(
          pairs
            .slice(-24)
            .map((pair) => Math.round((pair.systolic + pair.diastolic) / 2)),
          Math.round((latestPair.systolic + latestPair.diastolic) / 2),
        ),
        latest: {
          timestamp: new Date().toISOString(),
          value: latestPair.systolic,
          systolic: latestPair.systolic,
          diastolic: latestPair.diastolic,
        },
      };
    }

    if (endpoint === "temperature") {
      const records = await readHealthConnectRecords(
        "BodyTemperature",
        startMs,
        endMs,
      );
      if (!records?.length) return null;

      const values = records
        .map((record) => asFiniteNumber(record?.temperature?.inCelsius))
        .filter((value): value is number => value != null)
        .map((value) => Math.round(value * 10) / 10);
      if (!values.length) return null;

      const latest = values[values.length - 1];
      return {
        displayValue: `${latest}`,
        history: ensureNonEmptyHistory(values.slice(-24), latest),
        latest: { timestamp: new Date().toISOString(), value: latest },
      };
    }

    if (endpoint === "o2") {
      const records = await readHealthConnectRecords(
        "OxygenSaturation",
        startMs,
        endMs,
      );
      if (!records?.length) return null;

      const values = records
        .map((record) => asFiniteNumber(record?.percentage))
        .filter((value): value is number => value != null)
        .map((value) => (value <= 1 ? value * 100 : value))
        .map((value) => Math.round(value * 10) / 10);
      if (!values.length) return null;

      const latest = values[values.length - 1];
      return {
        displayValue: `${Math.round(latest)}`,
        history: ensureNonEmptyHistory(values.slice(-24), latest),
        latest: { timestamp: new Date().toISOString(), value: latest },
      };
    }

    if (endpoint === "sleep") {
      const records = await readHealthConnectRecords(
        "SleepSession",
        startMs,
        endMs,
      );
      if (!records?.length) return null;

      const durations = records
        .map((record) => {
          const start = toEpochMs(record?.startTime);
          const end = toEpochMs(record?.endTime);
          if (
            !Number.isFinite(start) ||
            !Number.isFinite(end) ||
            end <= start
          ) {
            return null;
          }
          const hours = (end - start) / (1000 * 60 * 60);
          return Math.round(hours * 10) / 10;
        })
        .filter((value): value is number => value != null && value > 0);

      if (!durations.length) return null;
      const totalSleep =
        Math.round(durations.reduce((sum, value) => sum + value, 0) * 10) / 10;

      return {
        displayValue: formatHours(totalSleep),
        history: ensureNonEmptyHistory(durations.slice(-24), totalSleep),
        latest: { timestamp: new Date().toISOString(), value: totalSleep },
      };
    }

    if (
      endpoint === "cal" ||
      endpoint === "calories" ||
      endpoint === "glycemia"
    ) {
      const records = await readHealthConnectRecords(
        "TotalCaloriesBurned",
        startMs,
        endMs,
      );
      if (!records?.length) return null;

      const values = records
        .map((record) => asFiniteNumber(record?.energy?.inKilocalories))
        .filter((value): value is number => value != null)
        .map((value) => Math.round(value));
      if (!values.length) return null;

      const totalCalories = values.reduce((sum, value) => sum + value, 0);
      return {
        displayValue: `${totalCalories}`,
        history: ensureNonEmptyHistory(values.slice(-24), totalCalories),
        latest: { timestamp: new Date().toISOString(), value: totalCalories },
      };
    }

    if (endpoint === "stress") {
      const hrvRecords = await readHealthConnectRecords(
        "HeartRateVariabilityRmssd",
        startMs,
        endMs,
      );

      const hrvValues = (hrvRecords ?? [])
        .map((record) =>
          asFiniteNumber(
            record?.heartRateVariabilityMillis ??
              record?.heartRateVariability?.inMilliseconds,
          ),
        )
        .filter((value): value is number => value != null)
        .map((rmssd) =>
          clamp(Math.round(100 - ((rmssd - 15) / 85) * 100), 0, 100),
        );

      if (hrvValues.length) {
        const latest = hrvValues[hrvValues.length - 1];
        return {
          displayValue: `${latest}`,
          history: ensureNonEmptyHistory(hrvValues.slice(-24), latest),
          latest: { timestamp: new Date().toISOString(), value: latest },
        };
      }

      const bpmMetric = await fetchHealthConnectMetricDaily("bpm");
      if (!bpmMetric?.history?.length) return null;
      const stressHistory = bpmMetric.history.map(mapBpmToStressScore);
      const latest = mapBpmToStressScore(bpmMetric.latest.value ?? 0);

      return {
        displayValue: `${latest}`,
        history: ensureNonEmptyHistory(stressHistory, latest),
        latest: { timestamp: new Date().toISOString(), value: latest },
      };
    }

    return null;
  } catch (error) {
    console.log(
      `[useLatestMetric] fetchHealthConnectMetricDaily(${endpoint}) failed`,
      error,
    );
    return null;
  }
}

// ─── Hooks públicos ───────────────────────────────────────────────────────────

export function useMetricStats(endpoint: string) {
  return useQuery({
    queryKey: [endpoint, "stats"],
    enabled: !!endpoint && endpoint !== "undefined",
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    queryFn: async () => {
      const healthConnectOnly =
        Platform.OS === "android" && HEALTH_CONNECT_ENDPOINTS.has(endpoint);

      const healthConnectMetric =
        endpoint === "steps"
          ? await fetchHealthConnectStepsDaily()
          : await fetchHealthConnectMetricDaily(endpoint);

      if (healthConnectMetric?.history?.length) {
        return {
          min: Math.min(...healthConnectMetric.history),
          max: Math.max(...healthConnectMetric.history),
        };
      }

      if (healthConnectOnly) return { min: 0, max: 0 };

      // Para todos os outros, calcula min/max a partir da BD
      const typeNames = TYPE_MAP[endpoint];
      if (!typeNames) return { min: 0, max: 0 };

      const isBP = BP_ENDPOINTS.has(endpoint);
      const dataRaw = await fetchMetricFromSupabaseByTypeNames(typeNames, isBP);
      const data = endpoint === "sleep" ? mapMetricToHours(dataRaw) : dataRaw;
      if (!data?.history?.length) return { min: 0, max: 0 };

      return {
        min: Math.min(...data.history),
        max: Math.max(...data.history),
      };
    },
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  });
}

export function useHealthMetric(endpoint: string, isBP: boolean = false) {
  return useQuery({
    queryKey: [endpoint, "latest"],
    enabled: !!endpoint && endpoint !== "undefined",
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    queryFn: async () => {
      const healthConnectOnly =
        Platform.OS === "android" && HEALTH_CONNECT_ENDPOINTS.has(endpoint);

      // Passos — Health Connect primeiro (valor diario em tempo real), BD como fallback
      if (endpoint === "steps") {
        const stepsMetric = await fetchHealthConnectStepsDaily();
        if (stepsMetric) return stepsMetric;
        return healthConnectOnly ? null : fetchStepsFromSupabaseDaily();
      }

      const healthConnectMetric = await fetchHealthConnectMetricDaily(endpoint);
      if (healthConnectMetric) return healthConnectMetric;

      if (healthConnectOnly) return null;

      // Todos os outros endpoints — BD via Supabase
      const typeNames = TYPE_MAP[endpoint];
      if (!typeNames) {
        console.warn(`[useHealthMetric] Endpoint desconhecido: "${endpoint}"`);
        return null;
      }

      const useBP = isBP || BP_ENDPOINTS.has(endpoint);
      const dataRaw = await fetchMetricFromSupabaseByTypeNames(
        typeNames,
        useBP,
      );
      return endpoint === "sleep" ? mapMetricToHours(dataRaw) : dataRaw;
    },
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  });
}
