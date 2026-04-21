import {
    getHealthConnectStatus,
    readSteps,
    type StepRecord,
} from "@/src/services/healthConnect";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Platform } from "react-native";

const API_BASE = Platform.select({
  android: "http://10.0.2.2:3000",
  default: "http://localhost:3000",
});

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

type HealthConnectFallbackRecord = {
  startTime: number;
  endTime: number;
  count: number;
};

function getDayWindow(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + DAY_MS);
  return {
    startMs: start.getTime(),
    endMs: end.getTime(),
  };
}

function aggregateStepsByHour(
  records: Array<StepRecord | HealthConnectFallbackRecord>,
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
      ) => Promise<{ records?: Array<Record<string, unknown>> }>;
    };

    if (
      typeof healthConnect.initialize !== "function" ||
      typeof healthConnect.readRecords !== "function"
    ) {
      return null;
    }

    const initialized = await healthConnect.initialize();
    if (!initialized) {
      console.log("[StepsWidget] fallback initialize=false");
      return null;
    }

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

        return {
          startTime,
          endTime,
          count,
        };
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

async function fetchMetricFromApi(
  endpoint: string,
  isBP: boolean,
): Promise<MetricQueryData | null> {
  const response = await axios.get(`${API_BASE}/${endpoint}`);
  const data = response.data as ApiMetricRecord[];

  if (!Array.isArray(data) || data.length === 0) return null;

  const sorted = [...data].sort(
    (a, b) =>
      new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime(),
  );

  const latest = sorted[0];
  const history = sorted.slice(0, 20).map((item) => {
    if (isBP && item.systolic !== undefined && item.diastolic !== undefined) {
      return Math.round((item.systolic + item.diastolic) / 2);
    }
    return Number(item.value ?? 0);
  });

  return {
    displayValue: isBP
      ? `${latest.systolic ?? "--"}/${latest.diastolic ?? "--"}`
      : `${latest.value ?? 0}`,
    history,
    latest,
  };
}

async function fetchHealthConnectStepsDaily(): Promise<MetricQueryData | null> {
  if (Platform.OS !== "android") {
    return null;
  }

  try {
    const status = await getHealthConnectStatus();
    if (!status.available || !status.permissionsGranted) {
      console.log("[StepsWidget] health connect unavailable or permission missing", {
        available: status.available,
        permissionsGranted: status.permissionsGranted,
      });
      return null;
    }

    const { startMs, endMs } = getDayWindow(new Date());
    let records: Array<StepRecord | HealthConnectFallbackRecord> = [];

    try {
      records = await readSteps(startMs, endMs);
      console.log("[StepsWidget] native bridge records", {
        recordsCount: records.length,
      });
    } catch (nativeError) {
      console.log("[StepsWidget] native bridge readSteps failed", nativeError);
    }

    if (!records.length) {
      const fallbackRecords = await readStepsWithLibraryFallback(startMs, endMs);
      if (fallbackRecords?.length) {
        records = fallbackRecords;
      }
    }

    if (!records.length) {
      console.log("[StepsWidget] no step records from bridge or fallback");
    }

    const hourly = aggregateStepsByHour(records, startMs, endMs);
    const totalSteps = hourly.reduce((sum, value) => sum + value, 0);
    const nowIso = new Date().toISOString();

    console.log("[StepsWidget] final daily aggregate", {
      totalSteps,
      hourlyLength: hourly.length,
      hourlyPreview: hourly.slice(0, 6),
    });

    return {
      displayValue: `${totalSteps}`,
      // Keep newest-first to match current app expectations.
      history: [...hourly].reverse(),
      latest: {
        timestamp: nowIso,
        value: totalSteps,
      },
    };
  } catch (error) {
    console.log("[StepsWidget] fetchHealthConnectStepsDaily fatal error", error);
    return null;
  }
}

export function useMetricStats(endpoint: string) {
  return useQuery({
    queryKey: [endpoint, "stats"],
    enabled: !!endpoint && endpoint !== "undefined",
    queryFn: async () => {
      if (endpoint === "steps") {
        const stepsMetric = await fetchHealthConnectStepsDaily();
        if (stepsMetric?.history?.length) {
          return {
            min: Math.min(...stepsMetric.history),
            max: Math.max(...stepsMetric.history),
          };
        }
      }

      const response = await axios.get(`${API_BASE}/${endpoint}Stats`);
      return response.data as { min: number; max: number };
    },
    refetchInterval: 10000,
  });
}

export function useHealthMetric(endpoint: string, isBP: boolean = false) {
  return useQuery({
    queryKey: [endpoint, "latest"],
    enabled: !!endpoint && endpoint !== "undefined", // Proteção extra
    queryFn: async () => {
      if (endpoint === "steps") {
        const healthConnectSteps = await fetchHealthConnectStepsDaily();
        if (healthConnectSteps) return healthConnectSteps;
      }

      return fetchMetricFromApi(endpoint, isBP);
    },
    refetchInterval: 5000,
  });
}
