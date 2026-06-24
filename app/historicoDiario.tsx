import { CalendarButton } from "@/components/buttons/calendarButton";
import { CalendarModal } from "@/components/modals/CalendarModal";
import { getSupabaseClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "../components/buttons/backButton";

import LightBackground from "@/components/DotBackground";
import { useTheme } from "@/hooks/useTheme";
import { format } from "date-fns";

const { width: screenWidth } = Dimensions.get("window");
const GRID_GAP = 10;
const CARD_WIDTH = screenWidth - 32;
const CARD_HEIGHT = 170;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAILY_RECORD_MS = 26 * 60 * 60 * 1000;
const MAX_REASONABLE_DAILY_STEPS = 100_000;
const HISTORY_QUERY_LIMIT = 5000;

type CalendarMode = "day" | "period";
type MetricKey =
  | "heartRate"
  | "bloodPressure"
  | "steps"
  | "sleep"
  | "o2";

type RangeSelection = {
  mode: CalendarMode;
  start: Date;
  end: Date;
};

type MetricSeries = {
  minValue: string;
  avgValue: string;
  maxValue: string;
  pointCount: number;
};

type MetricCardConfig = {
  key: MetricKey;
  label: string;
  unit: string;
  typeNames: string[];
};

type BiometricTypeRow = {
  id: string | number;
  name: string;
};

type BiometricDataRow = {
  id?: string | number | null;
  biometric_data_type_id: string | number;
  value: number | string | null;
  value_secondary?: number | string | null;
  measured_at?: string | null;
  created_at?: string | null;
  start_time?: string | null;
  end_time?: string | null;
};

const METRIC_CARDS: MetricCardConfig[] = [
  {
    key: "heartRate",
    label: "Batimentos",
    unit: "bpm",
    typeNames: ["heart_rate", "Batimento Cardíaco"],
  },
  {
    key: "bloodPressure",
    label: "Tensão",
    unit: "mmHg",
    typeNames: ["blood_pressure", "Pressão Arterial"],
  },
  {
    key: "steps",
    label: "Passos",
    unit: "",
    typeNames: ["steps"],
  },
  {
    key: "sleep",
    label: "Sono",
    unit: "h",
    typeNames: ["sleep"],
  },
  {
    key: "o2",
    label: "Oxigénio",
    unit: "%",
    typeNames: ["oxygen_saturation", "Saturação de Oxigénio"],
  },
];

const createEmptySeries = (): Record<MetricKey, MetricSeries> =>
  METRIC_CARDS.reduce(
    (acc, metric) => {
      acc[metric.key] = {
        minValue: "--",
        avgValue: "--",
        maxValue: "--",
        pointCount: 0,
      };
      return acc;
    },
    {} as Record<MetricKey, MetricSeries>,
  );

const toEpoch = (value: string | null | undefined) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
};

const normalizeBounds = (range: RangeSelection) => {
  const start = new Date(range.start);
  const end = new Date(range.end);
  if (start.getTime() > end.getTime()) {
    const temp = new Date(start);
    start.setTime(end.getTime());
    end.setTime(temp.getTime());
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return {
    startMs: start.getTime(),
    endMs: end.getTime(),
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
};

const formatDisplayValue = (key: MetricKey, value: number) => {
  if (!Number.isFinite(value)) return "--";

  switch (key) {
    case "steps":
      return Math.round(value).toLocaleString("pt-PT");
    case "sleep":
      return value.toFixed(1);
    case "o2":
      return value.toFixed(1);
    default:
      return `${Math.round(value)}`;
  }
};

const normalizeSeriesPoint = (key: MetricKey, value: number) => {
  if (!Number.isFinite(value)) return 0;
  if (key === "sleep") {
    return Math.round(value * 10) / 10;
  }
  if (key === "o2") {
    const percentage = value <= 1 ? value * 100 : value;
    return Math.round(percentage * 10) / 10;
  }
  return Math.round(value);
};

type MetricPoint = {
  timestamp: number;
  value: number;
  displayValue?: string;
};

const isCumulativeMetric = (key: MetricKey) => key === "steps";

const getMetricInterval = (row: BiometricDataRow) => {
  const startTime = toEpoch(row.start_time);
  const endTime = toEpoch(row.end_time);
  if (startTime === null || endTime === null || endTime <= startTime) {
    return null;
  }
  return {
    startTime,
    endTime,
    durationMs: endTime - startTime,
  };
};

const getIntervalDaySpan = (row: BiometricDataRow) => {
  const interval = getMetricInterval(row);
  if (!interval) return 1;
  return Math.max(1, Math.round(interval.durationMs / DAY_MS));
};

const getHistoryTimestamp = (
  key: MetricKey,
  row: BiometricDataRow,
  startMs: number,
  endMs: number,
) => {
  const interval = getMetricInterval(row);
  const measuredAt = toEpoch(row.measured_at);
  const createdAt = toEpoch(row.created_at);

  if (
    key === "sleep" &&
    interval &&
    interval.endTime >= startMs &&
    interval.startTime <= endMs
  ) {
    return interval.endTime;
  }

  if (
    interval &&
    interval.durationMs <= MAX_DAILY_RECORD_MS &&
    interval.endTime >= startMs &&
    interval.startTime <= endMs
  ) {
    return interval.startTime;
  }

  const startTime = toEpoch(row.start_time);
  const endTime = toEpoch(row.end_time);
  const inRange = (timestamp: number | null) =>
    timestamp !== null && timestamp >= startMs && timestamp <= endMs;

  if (isCumulativeMetric(key)) return startTime ?? measuredAt ?? createdAt;
  if (inRange(startTime)) return startTime;
  if (inRange(endTime)) return endTime;
  if (inRange(measuredAt)) return measuredAt;
  return startTime ?? endTime ?? measuredAt ?? createdAt;
};

const normalizeRowValue = (key: MetricKey, row: BiometricDataRow) => {
  const rawValue = Number(row.value ?? NaN);
  if (!Number.isFinite(rawValue)) return null;

  if (key === "bloodPressure") {
    const diastolic = Number(row.value_secondary ?? NaN);
    return Number.isFinite(diastolic) ? (rawValue + diastolic) / 2 : rawValue;
  }

  if (key === "o2") return normalizeSeriesPoint(key, rawValue);

  if (key === "sleep") {
    const value =
      getIntervalDaySpan(row) > 1 ? rawValue / getIntervalDaySpan(row) : rawValue;
    return Math.round(value * 10) / 10;
  }

  return rawValue;
};

const isReasonablePointValue = (key: MetricKey, value: number) => {
  if (!Number.isFinite(value)) return false;
  if (key === "heartRate") return value >= 20 && value <= 240;
  if (key === "o2") return value >= 50 && value <= 100;
  if (key === "sleep") return value > 0 && value <= 24;
  if (key === "steps") return value > 0 && value <= MAX_REASONABLE_DAILY_STEPS;
  return true;
};

const getNonOverlappingCumulativeRows = (
  rows: BiometricDataRow[],
  key: MetricKey,
  startMs: number,
  endMs: number,
) => {
  const intervals = rows
    .map((row) => {
      const interval = getMetricInterval(row);
      const value = Number(row.value ?? NaN);
      return { row, interval, value };
    })
    .filter(
      (
        item,
      ): item is {
        row: BiometricDataRow;
        interval: { startTime: number; endTime: number; durationMs: number };
        value: number;
      } =>
        !!item.interval &&
        item.interval.durationMs <= MAX_DAILY_RECORD_MS &&
        item.interval.endTime >= startMs &&
        item.interval.startTime <= endMs &&
        isReasonablePointValue(key, item.value),
    )
    .sort((a, b) =>
      a.interval.startTime !== b.interval.startTime
        ? a.interval.startTime - b.interval.startTime
        : a.interval.durationMs - b.interval.durationMs,
    );

  const deduped: BiometricDataRow[] = [];
  let coveredUpTo = -Infinity;

  for (const interval of intervals) {
    if (interval.interval.startTime >= coveredUpTo) {
      deduped.push(interval.row);
      coveredUpTo = interval.interval.endTime;
      continue;
    }

    if (interval.interval.endTime <= coveredUpTo) continue;

    const uncoveredFraction =
      (interval.interval.endTime - coveredUpTo) / interval.interval.durationMs;
    deduped.push({
      ...interval.row,
      start_time: new Date(coveredUpTo).toISOString(),
      value: Math.round(interval.value * uncoveredFraction),
    });
    coveredUpTo = interval.interval.endTime;
  }

  return deduped;
};

const getLocalDayKey = (timestamp: number) => {
  const day = new Date(timestamp);
  day.setHours(0, 0, 0, 0);
  return day.getTime();
};

const aggregateDailyPoints = (key: MetricKey, points: MetricPoint[]) => {
  const buckets = new Map<number, MetricPoint[]>();
  points.forEach((point) => {
    const dayKey = getLocalDayKey(point.timestamp);
    const bucket = buckets.get(dayKey) ?? [];
    bucket.push(point);
    buckets.set(dayKey, bucket);
  });

  return Array.from(buckets.entries())
    .map(([timestamp, bucket]) => {
      const values = bucket.map((point) => point.value);
      const value = isCumulativeMetric(key)
        ? values.reduce((sum, current) => sum + current, 0)
        : key === "sleep"
          ? Math.max(...values)
          : values.reduce((sum, current) => sum + current, 0) / values.length;

      return { timestamp, value };
    })
    .sort((a, b) => a.timestamp - b.timestamp);
};

const buildMetricSeries = (
  metric: MetricCardConfig,
  rawPoints: MetricPoint[],
): MetricSeries => {
  const sortedPoints = [...rawPoints].sort((a, b) => a.timestamp - b.timestamp);
  if (!sortedPoints.length) {
    return {
      minValue: "--",
      avgValue: "--",
      maxValue: "--",
      pointCount: 0,
    };
  }

  const dailyPoints = aggregateDailyPoints(metric.key, sortedPoints);
  const valuesForSummary =
    isCumulativeMetric(metric.key)
      ? dailyPoints.map((point) => point.value)
      : sortedPoints.map((point) => point.value);
  const normalizedValues = valuesForSummary
    .map((value) => normalizeSeriesPoint(metric.key, value))
    .filter((value) => Number.isFinite(value));

  if (!normalizedValues.length) {
    return {
      minValue: "--",
      avgValue: "--",
      maxValue: "--",
      pointCount: sortedPoints.length,
    };
  }

  const min = Math.min(...normalizedValues);
  const max = Math.max(...normalizedValues);
  const avg =
    normalizedValues.reduce((sum, value) => sum + value, 0) /
    normalizedValues.length;

  return {
    minValue: formatDisplayValue(metric.key, min),
    avgValue: formatDisplayValue(metric.key, avg),
    maxValue: formatDisplayValue(metric.key, max),
    pointCount: sortedPoints.length,
  };
};

const fetchMetricsByRange = async (
  range: RangeSelection,
): Promise<Record<MetricKey, MetricSeries>> => {
  const empty = createEmptySeries();
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const patientId = session?.user?.id;
  if (!patientId) {
    console.log("[DETALHE HISTORICO] sem sessao/patientId — devolve vazio");
    return empty;
  }

  const { startMs, endMs, startIso, endIso } = normalizeBounds(range);

  const typeNameToMetric = new Map<string, MetricKey>();
  METRIC_CARDS.forEach((metric) => {
    metric.typeNames.forEach((typeName) => {
      typeNameToMetric.set(typeName, metric.key);
    });
  });

  const allTypeNames = Array.from(typeNameToMetric.keys());
  const { data: typeRows, error: typeError } = await supabase
    .from("biometric_data_types")
    .select("id,name")
    .in("name", allTypeNames);

  if (typeError || !Array.isArray(typeRows) || typeRows.length === 0) {
    console.log("[DETALHE HISTORICO] sem biometric_data_types — devolve vazio", {
      patientId,
      typeError: typeError?.message ?? null,
      typeRowCount: Array.isArray(typeRows) ? typeRows.length : 0,
    });
    return empty;
  }

  const typeIdToMetric = new Map<string, MetricKey>();
  (typeRows as BiometricTypeRow[]).forEach((row) => {
    const key = typeNameToMetric.get(String(row.name));
    if (key) typeIdToMetric.set(String(row.id), key);
  });

  const typeIds = Array.from(typeIdToMetric.keys());
  if (!typeIds.length) return empty;

  const rowSelect =
    "id,biometric_data_type_id,value,value_secondary,start_time,end_time,measured_at,created_at";

  const [intervalQuery, measuredQuery, createdQuery] = await Promise.all([
    supabase
      .from("biometric_data")
      .select(rowSelect)
      .eq("patient_id", patientId)
      .in("biometric_data_type_id", typeIds)
      .lt("start_time", endIso)
      .gt("end_time", startIso)
      .order("start_time", { ascending: true, nullsFirst: false })
      .limit(HISTORY_QUERY_LIMIT),
    supabase
      .from("biometric_data")
      .select(rowSelect)
      .eq("patient_id", patientId)
      .in("biometric_data_type_id", typeIds)
      .gte("measured_at", startIso)
      .lte("measured_at", endIso)
      .order("measured_at", { ascending: true, nullsFirst: false })
      .limit(HISTORY_QUERY_LIMIT),
    supabase
      .from("biometric_data")
      .select(rowSelect)
      .eq("patient_id", patientId)
      .in("biometric_data_type_id", typeIds)
      .gte("created_at", startIso)
      .lte("created_at", endIso)
      .order("created_at", { ascending: true })
      .limit(HISTORY_QUERY_LIMIT),
  ]);

  const queryError =
    intervalQuery.error ?? measuredQuery.error ?? createdQuery.error;
  if (queryError) {
    console.log("[DETALHE HISTORICO] erro ao carregar biometric_data", {
      patientId,
      error: queryError.message,
    });
    return empty;
  }

  const rowsById = new Map<string, BiometricDataRow>();
  [
    ...(intervalQuery.data ?? []),
    ...(measuredQuery.data ?? []),
    ...(createdQuery.data ?? []),
  ].forEach((row, index) => {
    const typedRow = row as BiometricDataRow;
    rowsById.set(String(typedRow.id ?? `row-${index}`), typedRow);
  });

  const rowsByMetric = METRIC_CARDS.reduce(
    (acc, metric) => {
      acc[metric.key] = [] as BiometricDataRow[];
      return acc;
    },
    {} as Record<MetricKey, BiometricDataRow[]>,
  );

  Array.from(rowsById.values()).forEach((row) => {
    const key = typeIdToMetric.get(String(row.biometric_data_type_id));
    if (key) rowsByMetric[key].push(row);
  });

  const pointBuckets = METRIC_CARDS.reduce(
    (acc, metric) => {
      acc[metric.key] = [] as MetricPoint[];
      return acc;
    },
    {} as Record<MetricKey, MetricPoint[]>,
  );

  METRIC_CARDS.forEach((metric) => {
    const candidateRows = isCumulativeMetric(metric.key)
      ? getNonOverlappingCumulativeRows(
          rowsByMetric[metric.key],
          metric.key,
          startMs,
          endMs,
        )
      : rowsByMetric[metric.key];

    candidateRows.forEach((row) => {
      const timestamp = getHistoryTimestamp(metric.key, row, startMs, endMs);
      const value = normalizeRowValue(metric.key, row);
      if (
        timestamp === null ||
        timestamp < startMs ||
        timestamp > endMs ||
        value === null ||
        !isReasonablePointValue(metric.key, value)
      ) {
        return;
      }

      const displayValue =
        metric.key === "bloodPressure"
          ? (() => {
              const systolic = Number(row.value ?? NaN);
              const diastolic = Number(row.value_secondary ?? NaN);
              if (!Number.isFinite(systolic)) return undefined;
              return Number.isFinite(diastolic)
                ? `${Math.round(systolic)}/${Math.round(diastolic)}`
                : `${Math.round(systolic)}`;
            })()
          : undefined;

      pointBuckets[metric.key].push({ timestamp, value, displayValue });
    });
  });

  const result = createEmptySeries();
  METRIC_CARDS.forEach((metric) => {
    result[metric.key] = buildMetricSeries(
      metric,
      pointBuckets[metric.key],
    );
  });

  METRIC_CARDS.forEach((metric) => {
    const series = result[metric.key];
    console.log("[DETALHE HISTORICO]", {
      metric: metric.key,
      rangeMode: range.mode,
      pointCount: series.pointCount,
      minValue: series.minValue,
      avgValue: series.avgValue,
      maxValue: series.maxValue,
    });
  });

  return result;
};

const HistoricoDiarioContent = () => {
  const router = useRouter();
  const [selectedRange, setSelectedRange] = useState<RangeSelection>(() => ({
    mode: "day",
    start: new Date(),
    end: new Date(),
  }));
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("day");
  const { isDark } = useTheme();

  const { data: metricSeries, isLoading } = useQuery({
    queryKey: [
      "historico-diario-metrics",
      selectedRange.mode,
      selectedRange.start.toISOString(),
      selectedRange.end.toISOString(),
    ],
    queryFn: () => fetchMetricsByRange(selectedRange),
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });

  const dateLabel = useMemo(() => {
    const formattedStart = format(selectedRange.start, "dd/MM/yyyy");
    const formattedEnd = format(selectedRange.end, "dd/MM/yyyy");
    if (selectedRange.mode === "day") {
      return `Dia: ${formattedStart}`;
    }
    return `Período: ${formattedStart} - ${formattedEnd}`;
  }, [selectedRange.end, selectedRange.mode, selectedRange.start]);

  const handleOpenCalendar = (mode: CalendarMode) => {
    setCalendarMode(mode);
    setIsModalVisible(true);
  };

  const handleSelectDay = (selectedDate: Date) => {
    setSelectedRange({ mode: "day", start: selectedDate, end: selectedDate });
  };

  const handleSelectPeriod = (start: Date, end: Date) => {
    const startDate = start.getTime() <= end.getTime() ? start : end;
    const endDate = start.getTime() <= end.getTime() ? end : start;
    setSelectedRange({ mode: "period", start: startDate, end: endDate });
  };

  return (
    <LightBackground>
      <View className="flex-1 px-4 pt-10">
        <SafeAreaView className="flex-1">
          <View className="mb-4">
            <BackButton
              label="Histórico Diário"
              dark={isDark}
              onPress={() => router.push("/testDashboard")}
            />
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <View className="items-center">
              <View className="mb-3 flex-row items-center justify-center">
                <CalendarButton
                  label="Dia"
                  onPress={() => handleOpenCalendar("day")}
                />
                <CalendarButton
                  label="Período"
                  onPress={() => handleOpenCalendar("period")}
                />
              </View>
              <Text
                className={`text-center text-[15px] font-medium ${isDark ? "text-gray-100" : "text-gray-800"}`}
              >
                {dateLabel}
              </Text>
            </View>

            <CalendarModal
              isVisible={isModalVisible}
              onClose={() => setIsModalVisible(false)}
              mode={calendarMode}
              onSelectDay={handleSelectDay}
              onSelectPeriod={handleSelectPeriod}
              initialDate={selectedRange.start}
            />

            {isLoading ? (
              <View className="items-center justify-center py-12">
                <ActivityIndicator size="small" color="#7C89FF" />
                <Text
                  className={`mt-2 text-sm ${isDark ? "text-white/70" : "text-black/60"}`}
                >
                  A carregar métricas do intervalo selecionado...
                </Text>
              </View>
            ) : (
              <View
                className="mt-3 flex-row flex-wrap"
                style={{ gap: GRID_GAP }}
              >
                {METRIC_CARDS.map((metric) => {
                  const data = metricSeries?.[metric.key] ?? {
                    minValue: "--",
                    avgValue: "--",
                    maxValue: "--",
                    pointCount: 0,
                  };

                  return (
                    <View
                      key={metric.key}
                      className={`rounded-3xl border p-3 ${isDark ? "bg-aide-dark-card border-white/10" : "bg-white border-gray-100"}`}
                      style={{
                        width: CARD_WIDTH,
                        minHeight: CARD_HEIGHT,
                        boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
                      }}
                    >
                      <View className="mb-2 flex-row items-start justify-between">
                        <Text
                          className={`text-sm font-safiro ${isDark ? "text-white" : "text-black"}`}
                        >
                          {metric.label}
                        </Text>
                      </View>
                      <Text
                        className={`mb-3 text-xs font-open-sans ${isDark ? "text-white/55" : "text-black/50"}`}
                      >
                        Overview do intervalo · {data.pointCount}{" "}
                        {data.pointCount === 1 ? "registo" : "registos"}
                      </Text>

                      <View className="flex-row" style={{ gap: 10 }}>
                        {[
                          { label: "Máx", value: data.maxValue },
                          { label: "Média", value: data.avgValue },
                          { label: "Mín", value: data.minValue },
                        ].map((item) => (
                          <View
                            key={item.label}
                            className={`flex-1 rounded-2xl border p-3 ${isDark ? "border-white/10 bg-white/5" : "border-gray-100 bg-gray-50"}`}
                          >
                            <Text
                              className={`mb-1 text-[11px] font-open-sans ${isDark ? "text-white/60" : "text-black/50"}`}
                            >
                              {item.label}
                            </Text>
                            <Text
                              className={`text-base font-bold font-safiro ${isDark ? "text-white" : "text-black"}`}
                            >
                              {item.value}
                              {metric.unit ? ` ${metric.unit}` : ""}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </LightBackground>
  );
};

const HistoricoDiario = () => {
  return <HistoricoDiarioContent />;
};

export default HistoricoDiario;
