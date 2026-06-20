import {
  getHealthConnectStatus,
  readSteps,
  type StepRecord,
} from "@/src/services/healthConnect";
import { getSupabaseClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Platform } from "react-native";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MAX_DAILY_RECORD_MS = 26 * HOUR_MS;
const MAX_REASONABLE_DAILY_STEPS = 100_000;

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

type TargetPatientId = string | null | undefined;

function normalizeTargetPatientId(
  targetPatientId: TargetPatientId,
): string | null | undefined {
  if (targetPatientId === null) return null;
  if (typeof targetPatientId !== "string") return undefined;

  const trimmed = targetPatientId.trim();
  return trimmed ? trimmed : null;
}

async function getAuthenticatedUserId() {
  const {
    data: { session },
  } = await getSupabaseClient().auth.getSession();

  return session?.user?.id ?? null;
}

async function resolvePatientId(
  targetPatientId: TargetPatientId,
): Promise<string | null> {
  const normalizedTargetPatientId = normalizeTargetPatientId(targetPatientId);

  if (normalizedTargetPatientId === null) return null;
  if (typeof normalizedTargetPatientId === "string") {
    return normalizedTargetPatientId;
  }

  return getAuthenticatedUserId();
}

// ─── Supabase fetch ────────────────────────────────────────────────────────────

async function fetchMetricFromSupabaseByTypeNames(
  typeNames: string[],
  isBP: boolean,
  targetPatientId?: TargetPatientId,
): Promise<MetricQueryData | null> {
  const patientId = await resolvePatientId(targetPatientId);
  if (!patientId) return null;

  const { data: typeRows, error: typeError } = await getSupabaseClient()
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

  const { data: rows, error } = await getSupabaseClient()
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

function toHoursValue(value: unknown) {
  const hours = Number(value ?? 0);
  if (!Number.isFinite(hours)) return 0;
  return hours;
}

function formatHours(hours: number) {
  if (!Number.isFinite(hours) || hours <= 0) return "--";
  return hours < 10 ? hours.toFixed(1) : `${Math.round(hours)}`;
}

// Sleep is stored in the DB already in hours (see healthBackgroundSync.ts and the
// 'hours' type seed), so this only formats/rounds — it must NOT convert units.
function mapMetricToHours(
  metric: MetricQueryData | null,
): MetricQueryData | null {
  if (!metric) return null;
  const latestHours = toHoursValue(metric.latest?.value);
  return {
    ...metric,
    displayValue: formatHours(latestHours),
    history: metric.history.map((v) => {
      const hours = toHoursValue(v);
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

  const nonOverlappingRecords = getNonOverlappingStepRecords(records);

  nonOverlappingRecords.forEach((record) => {
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

function getNonOverlappingStepRecords(
  records: (StepRecord | HealthConnectFallbackRecord)[],
): HealthConnectFallbackRecord[] {
  const intervals = records
    .map((record) => ({
      startTime: record.startTime,
      endTime: record.endTime,
      count: record.count,
      sourceApp: "sourceApp" in record ? record.sourceApp : null,
    }))
    .filter(
      (record) =>
        Number.isFinite(record.startTime) &&
        Number.isFinite(record.endTime) &&
        record.endTime > record.startTime &&
        Number.isFinite(record.count) &&
        record.count > 0 &&
        record.count <= MAX_REASONABLE_DAILY_STEPS,
    )
    .sort((a, b) =>
      a.startTime !== b.startTime
        ? a.startTime - b.startTime
        : a.endTime - a.startTime - (b.endTime - b.startTime),
    );

  const deduped: HealthConnectFallbackRecord[] = [];
  let coveredUpTo = -Infinity;

  for (const record of intervals) {
    if (record.startTime >= coveredUpTo) {
      deduped.push(record);
      coveredUpTo = record.endTime;
      continue;
    }

    if (record.endTime <= coveredUpTo) continue;

    const uncoveredFraction =
      (record.endTime - coveredUpTo) / (record.endTime - record.startTime);
    deduped.push({
      ...record,
      startTime: coveredUpTo,
      count: Math.round(record.count * uncoveredFraction),
    });
    coveredUpTo = record.endTime;
  }

  return deduped;
}

async function fetchStepsFromSupabaseDaily(
  targetPatientId?: TargetPatientId,
): Promise<MetricQueryData | null> {
  const patientId = await resolvePatientId(targetPatientId);
  if (!patientId) return null;

  const { data: typeRow, error: typeError } = await getSupabaseClient()
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

  const { data: rows, error } = await getSupabaseClient()
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
  if (!shortWindowRecords.length) return null;

  const hourly = aggregateStepsByHour(shortWindowRecords, startMs, endMs);
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

export function useMetricStats(
  endpoint: string,
  targetPatientId?: TargetPatientId,
) {
  const patientScope =
    targetPatientId === null
      ? "none"
      : (normalizeTargetPatientId(targetPatientId) ?? "self");

  return useQuery({
    queryKey: [endpoint, "stats", patientScope],
    enabled: !!endpoint && endpoint !== "undefined",
    staleTime: 30_000,
    gcTime: 60_000,
    refetchOnReconnect: true,
    queryFn: async () => {
      const normalizedTargetPatientId =
        normalizeTargetPatientId(targetPatientId);
      if (normalizedTargetPatientId === null) return { min: 0, max: 0 };

      const authUserId = await getAuthenticatedUserId();
      const resolvedPatientId = await resolvePatientId(
        normalizedTargetPatientId,
      );
      if (!resolvedPatientId) return { min: 0, max: 0 };

      const canUseHealthConnect =
        Platform.OS === "android" && resolvedPatientId === authUserId;

      const healthConnectMetric = canUseHealthConnect
        ? endpoint === "steps"
          ? await fetchHealthConnectStepsDaily()
          : await fetchHealthConnectMetricDaily(endpoint)
        : null;

      if (healthConnectMetric?.history?.length) {
        return {
          min: Math.min(...healthConnectMetric.history),
          max: Math.max(...healthConnectMetric.history),
        };
      }

      // Sem dados do Health Connect (ex.: nada medido hoje) — recorre à BD,
      // que pode conter histórico gravado. Evita range vazio com dados na BD.
      const typeNames = TYPE_MAP[endpoint];
      if (!typeNames) return { min: 0, max: 0 };

      const isBP = BP_ENDPOINTS.has(endpoint);
      const dataRaw = await fetchMetricFromSupabaseByTypeNames(
        typeNames,
        isBP,
        resolvedPatientId,
      );
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

export function useHealthMetric(
  endpoint: string,
  isBP: boolean = false,
  targetPatientId?: TargetPatientId,
) {
  const patientScope =
    targetPatientId === null
      ? "none"
      : (normalizeTargetPatientId(targetPatientId) ?? "self");

  return useQuery({
    queryKey: [endpoint, "latest", patientScope],
    enabled: !!endpoint && endpoint !== "undefined",
    staleTime: 30_000,
    gcTime: 60_000,
    refetchOnReconnect: true,
    queryFn: async () => {
      const normalizedTargetPatientId =
        normalizeTargetPatientId(targetPatientId);
      if (normalizedTargetPatientId === null) return null;

      const authUserId = await getAuthenticatedUserId();
      const resolvedPatientId = await resolvePatientId(
        normalizedTargetPatientId,
      );
      if (!resolvedPatientId) return null;

      const canUseHealthConnect =
        Platform.OS === "android" && resolvedPatientId === authUserId;

      // Passos — Health Connect primeiro (valor diario em tempo real), BD como fallback
      if (endpoint === "steps") {
        const stepsMetric = canUseHealthConnect
          ? await fetchHealthConnectStepsDaily()
          : null;
        if (stepsMetric) return stepsMetric;

        return fetchStepsFromSupabaseDaily(resolvedPatientId);
      }

      const healthConnectMetric = canUseHealthConnect
        ? await fetchHealthConnectMetricDaily(endpoint)
        : null;
      if (healthConnectMetric) return healthConnectMetric;

      // Sem dados do Health Connect (ex.: nada medido hoje) — recorre à BD,
      // que pode conter histórico gravado. Garante que a dashboard nunca fica
      // vazia quando os detalhes têm dados.
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
        resolvedPatientId,
      );
      return endpoint === "sleep" ? mapMetricToHours(dataRaw) : dataRaw;
    },
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  });
}

// ─── Histórico por janela temporal (dia/semana/mês) ───────────────────────────

export type MetricHistoryRange = "day" | "week" | "month";

export type MetricHistoryPoint = { value: number; t: number };

function getRangeWindow(range: MetricHistoryRange) {
  const end = new Date();
  const start = new Date(end);
  if (range === "day") start.setDate(start.getDate() - 1);
  else if (range === "week") start.setDate(start.getDate() - 7);
  else start.setDate(start.getDate() - 30);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    startMs: start.getTime(),
    endMs: end.getTime(),
  };
}

function parseTimestamp(value: unknown): number | null {
  const parsed = Date.parse(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function timestampInRange(t: number | null, startMs: number, endMs: number) {
  return t !== null && t >= startMs && t <= endMs;
}

function getHistoryPointTimestamp(
  row: any,
  endpoint: string,
  startMs: number,
  endMs: number,
): number | null {
  const measuredAt = parseTimestamp(row?.measured_at);
  const startTime = parseTimestamp(row?.start_time);
  const endTime = parseTimestamp(row?.end_time);
  const createdAt = parseTimestamp(row?.created_at);

  if (endpoint === "steps" || endpoint === "cal" || endpoint === "calories") {
    return startTime ?? measuredAt ?? createdAt;
  }

  if (timestampInRange(measuredAt, startMs, endMs)) return measuredAt;
  if (timestampInRange(endTime, startMs, endMs)) return endTime;
  if (timestampInRange(startTime, startMs, endMs)) return startTime;
  return measuredAt ?? endTime ?? startTime ?? createdAt;
}

function isCumulativeEndpoint(endpoint: string) {
  return endpoint === "steps" || endpoint === "cal" || endpoint === "calories";
}

function getNonOverlappingCumulativeRows(
  rows: any[],
  endpoint: string,
  startMs: number,
  endMs: number,
) {
  const intervals = rows
    .map((row) => {
      const startTime = parseTimestamp(row?.start_time);
      const endTime = parseTimestamp(row?.end_time);
      const value = Number(row?.value ?? NaN);
      return { row, startTime, endTime, value };
    })
    .filter(
      (
        item,
      ): item is {
        row: any;
        startTime: number;
        endTime: number;
        value: number;
      } =>
        item.startTime !== null &&
        item.endTime !== null &&
        item.endTime > item.startTime &&
        item.endTime - item.startTime <= MAX_DAILY_RECORD_MS &&
        item.endTime >= startMs &&
        item.startTime <= endMs &&
        Number.isFinite(item.value) &&
        isReasonableCumulativeValue(endpoint, item.value),
    )
    .sort((a, b) =>
      a.startTime !== b.startTime
        ? a.startTime - b.startTime
        : a.endTime - a.startTime - (b.endTime - b.startTime),
    );

  const deduped: any[] = [];
  let coveredUpTo = -Infinity;

  for (const interval of intervals) {
    if (interval.startTime >= coveredUpTo) {
      deduped.push(interval.row);
      coveredUpTo = interval.endTime;
      continue;
    }

    if (interval.endTime <= coveredUpTo) continue;

    const uncoveredFraction =
      (interval.endTime - coveredUpTo) /
      (interval.endTime - interval.startTime);
    deduped.push({
      ...interval.row,
      start_time: new Date(coveredUpTo).toISOString(),
      value: Math.round(interval.value * uncoveredFraction),
    });
    coveredUpTo = interval.endTime;
  }

  const intervalIds = new Set(deduped.map((row) => row?.id).filter(Boolean));
  const pointRows = rows.filter((row) => {
    if (row?.id && intervalIds.has(row.id)) return false;
    const startTime = parseTimestamp(row?.start_time);
    const endTime = parseTimestamp(row?.end_time);
    if (startTime !== null || endTime !== null) return false;
    if (!isReasonableCumulativeValue(endpoint, Number(row?.value ?? NaN))) {
      return false;
    }
    const t = parseTimestamp(row?.measured_at ?? row?.created_at);
    return timestampInRange(t, startMs, endMs);
  });

  return [...deduped, ...pointRows];
}

function isReasonableCumulativeValue(endpoint: string, value: number) {
  if (!Number.isFinite(value) || value <= 0) return false;
  if (endpoint === "steps") return value <= MAX_REASONABLE_DAILY_STEPS;
  return true;
}

async function fetchMetricHistoryRange(
  endpoint: string,
  range: MetricHistoryRange,
  targetPatientId?: TargetPatientId,
): Promise<MetricHistoryPoint[]> {
  const patientId = await resolvePatientId(targetPatientId);
  if (!patientId) return [];

  const typeNames = TYPE_MAP[endpoint];
  if (!typeNames) return [];

  const isBP = BP_ENDPOINTS.has(endpoint);
  const { startIso, endIso, startMs, endMs } = getRangeWindow(range);

  const { data: typeRows, error: typeError } = await getSupabaseClient()
    .from("biometric_data_types")
    .select("id,name")
    .in("name", typeNames);

  if (typeError) {
    console.error("[useMetricHistory] type lookup error", typeError);
    return [];
  }

  const typeIds = (Array.isArray(typeRows) ? typeRows : [])
    .map((row: any) => String(row?.id ?? ""))
    .filter(Boolean);
  if (!typeIds.length) return [];

  const intervalQuery = await getSupabaseClient()
    .from("biometric_data")
    .select(
      "id,value,value_secondary,start_time,end_time,measured_at,created_at",
    )
    .eq("patient_id", patientId)
    .in("biometric_data_type_id", typeIds)
    .lt("start_time", endIso)
    .gt("end_time", startIso)
    .order("start_time", { ascending: true, nullsFirst: false })
    .order("measured_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(500);

  if (intervalQuery.error) {
    console.error(
      "[useMetricHistory] interval history query error",
      intervalQuery.error,
    );
    return [];
  }

  const measuredQuery = await getSupabaseClient()
    .from("biometric_data")
    .select(
      "id,value,value_secondary,start_time,end_time,measured_at,created_at",
    )
    .eq("patient_id", patientId)
    .in("biometric_data_type_id", typeIds)
    .gte("measured_at", startIso)
    .lte("measured_at", endIso)
    .order("measured_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(500);

  if (measuredQuery.error) {
    console.error(
      "[useMetricHistory] measured history query error",
      measuredQuery.error,
    );
    return [];
  }

  const rowsById = new Map<string, any>();
  [...(intervalQuery.data ?? []), ...(measuredQuery.data ?? [])].forEach(
    (row: any, index) => {
      rowsById.set(String(row?.id ?? `row-${index}`), row);
    },
  );
  const rows = Array.from(rowsById.values());
  const historyRows = isCumulativeEndpoint(endpoint)
    ? getNonOverlappingCumulativeRows(rows, endpoint, startMs, endMs)
    : rows;

  // Devolve {valor, timestamp} em ordem cronológica (antigo → recente) para o
  // gráfico — o timestamp permite construir a escala do eixo de tempo.
  return historyRows
    .map((row): MetricHistoryPoint => {
      const t = getHistoryPointTimestamp(row, endpoint, startMs, endMs);
      if (isBP) {
        const sys = Number(row?.value ?? 0);
        const dia = Number(row?.value_secondary ?? 0);
        return { value: Math.round((sys + dia) / 2), t: t ?? NaN };
      }
      const value = Number(row?.value ?? 0);
      return {
        value: endpoint === "sleep" ? Math.round(value * 10) / 10 : value,
        t: t ?? NaN,
      };
    })
    .filter((p, index) => {
      if (!Number.isFinite(p.value) || !Number.isFinite(p.t)) return false;
      if (!isCumulativeEndpoint(endpoint)) {
        return p.t >= startMs && p.t <= endMs;
      }

      const row = historyRows[index];
      const startTime = parseTimestamp(row?.start_time);
      const endTime = parseTimestamp(row?.end_time);
      if (
        startTime !== null &&
        endTime !== null &&
        endTime - startTime > MAX_DAILY_RECORD_MS
      ) {
        return false;
      }
      return p.t >= startMs && p.t <= endMs;
    })
    .sort((a, b) => a.t - b.t);
}

export function useMetricHistory(
  endpoint: string,
  range: MetricHistoryRange,
  targetPatientId?: TargetPatientId,
) {
  const patientScope =
    targetPatientId === null
      ? "none"
      : (normalizeTargetPatientId(targetPatientId) ?? "self");

  return useQuery({
    queryKey: [endpoint, "history", range, patientScope],
    enabled: !!endpoint && endpoint !== "undefined",
    staleTime: 30_000,
    gcTime: 60_000,
    refetchOnReconnect: true,
    queryFn: () => fetchMetricHistoryRange(endpoint, range, targetPatientId),
  });
}
