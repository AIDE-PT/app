import { CalendarButton } from "@/components/buttons/calendarButton";
import LineChartSlim from "@/components/charts/LineChartSlim";
import { CalendarModal } from "@/components/modals/CalendarModal";
import { supabase } from "@/utils/supabase/client";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
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
const CARD_HEIGHT = 220;

type CalendarMode = "day" | "period";
type MetricKey =
  | "heartRate"
  | "bloodPressure"
  | "temp"
  | "steps"
  | "sleep"
  | "o2"
  | "cal"
  | "stress";

type RangeSelection = {
  mode: CalendarMode;
  start: Date;
  end: Date;
};

type MetricSeries = {
  points: number[];
  displayValue: string;
  pointCount: number;
};

type MetricCardConfig = {
  key: MetricKey;
  label: string;
  unit: string;
  color: string;
  segments: number;
  yAxisSuffix: string;
  yMin?: number;
  yMax?: number;
  typeNames: string[];
};

type BiometricTypeRow = {
  id: string | number;
  name: string;
};

type BiometricDataRow = {
  biometric_data_type_id: string | number;
  value: number | string | null;
  value_secondary?: number | string | null;
  measured_at?: string | null;
  created_at?: string | null;
  start_time?: string | null;
  end_time?: string | null;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

const METRIC_CARDS: MetricCardConfig[] = [
  {
    key: "heartRate",
    label: "Batimentos",
    unit: "bpm",
    color: "#7C89FF",
    segments: 4,
    yAxisSuffix: "",
    typeNames: ["heart_rate", "Batimento Cardíaco"],
  },
  {
    key: "bloodPressure",
    label: "Tensão",
    unit: "mmHg",
    color: "#7C89FF",
    segments: 4,
    yAxisSuffix: "",
    typeNames: ["blood_pressure", "Pressão Arterial"],
  },
  {
    key: "temp",
    label: "Temperatura",
    unit: "ºC",
    color: "#7C89FF",
    segments: 5,
    yAxisSuffix: "",
    yMin: 35,
    yMax: 40,
    typeNames: ["body_temperature", "Temperatura Corporal"],
  },
  {
    key: "steps",
    label: "Passos",
    unit: "",
    color: "#7C89FF",
    segments: 4,
    yAxisSuffix: "",
    typeNames: ["steps"],
  },
  {
    key: "sleep",
    label: "Sono",
    unit: "h",
    color: "#7C89FF",
    segments: 4,
    yAxisSuffix: "",
    typeNames: ["sleep"],
  },
  {
    key: "o2",
    label: "Oxigénio",
    unit: "%",
    color: "#7C89FF",
    segments: 4,
    yAxisSuffix: "",
    yMin: 88,
    yMax: 100,
    typeNames: ["oxygen_saturation", "Saturação de Oxigénio"],
  },
  {
    key: "cal",
    label: "Calorias",
    unit: "kcal",
    color: "#7C89FF",
    segments: 4,
    yAxisSuffix: "",
    typeNames: ["total_calories_burned", "calories"],
  },
  {
    key: "stress",
    label: "Stress",
    unit: "",
    color: "#7C89FF",
    segments: 4,
    yAxisSuffix: "",
    yMin: 0,
    yMax: 100,
    typeNames: ["stress"],
  },
];

const createEmptySeries = (): Record<MetricKey, MetricSeries> =>
  METRIC_CARDS.reduce(
    (acc, metric) => {
      acc[metric.key] = { points: [], displayValue: "--", pointCount: 0 };
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
    case "cal":
      return Math.round(value).toLocaleString("pt-PT");
    case "temp":
    case "sleep":
      return value.toFixed(1);
    default:
      return `${Math.round(value)}`;
  }
};

const normalizeSeriesPoint = (key: MetricKey, value: number) => {
  if (!Number.isFinite(value)) return 0;
  if (key === "temp" || key === "sleep") {
    return Math.round(value * 10) / 10;
  }
  return Math.round(value);
};

const fetchMetricsByRange = async (
  range: RangeSelection,
): Promise<Record<MetricKey, MetricSeries>> => {
  const empty = createEmptySeries();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const patientId = session?.user?.id;
  if (!patientId) return empty;

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
    return empty;
  }

  const typeIdToMetric = new Map<string, MetricKey>();
  let stepsTypeId: string | null = null;

  (typeRows as BiometricTypeRow[]).forEach((row) => {
    const key = typeNameToMetric.get(String(row.name));
    if (!key) return;
    const id = String(row.id);
    typeIdToMetric.set(id, key);
    if (key === "steps" && !stepsTypeId) {
      stepsTypeId = id;
    }
  });

  const pointBuckets = METRIC_CARDS.reduce(
    (acc, metric) => {
      acc[metric.key] = [] as {
        timestamp: number;
        value: number;
        displayValue?: string;
      }[];
      return acc;
    },
    {} as Record<
      MetricKey,
      { timestamp: number; value: number; displayValue?: string }[]
    >,
  );

  const nonStepTypeIds = Array.from(typeIdToMetric.entries())
    .filter(([, key]) => key !== "steps")
    .map(([id]) => id);

  if (nonStepTypeIds.length > 0) {
    const { data: rows } = await supabase
      .from("biometric_data")
      .select(
        "biometric_data_type_id,value,value_secondary,measured_at,created_at",
      )
      .eq("patient_id", patientId)
      .in("biometric_data_type_id", nonStepTypeIds)
      .gte("created_at", startIso)
      .lte("created_at", endIso)
      .order("measured_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    (Array.isArray(rows) ? (rows as BiometricDataRow[]) : []).forEach((row) => {
      const key = typeIdToMetric.get(String(row.biometric_data_type_id));
      if (!key || key === "steps") return;

      const timestamp = toEpoch(row.measured_at ?? row.created_at);
      if (timestamp === null || timestamp < startMs || timestamp > endMs) {
        return;
      }

      if (key === "bloodPressure") {
        const systolic = Number(row.value ?? NaN);
        const diastolic = Number(row.value_secondary ?? NaN);
        if (!Number.isFinite(systolic)) return;

        const value = Number.isFinite(diastolic)
          ? (systolic + diastolic) / 2
          : systolic;

        pointBuckets[key].push({
          timestamp,
          value,
          displayValue: Number.isFinite(diastolic)
            ? `${Math.round(systolic)}/${Math.round(diastolic)}`
            : `${Math.round(systolic)}`,
        });
        return;
      }

      const rawValue = Number(row.value ?? NaN);
      if (!Number.isFinite(rawValue)) return;

      const mappedValue = key === "sleep" ? rawValue / 60 : rawValue;
      pointBuckets[key].push({ timestamp, value: mappedValue });
    });
  }

  if (stepsTypeId) {
    const { data: stepRows } = await supabase
      .from("biometric_data")
      .select("value,start_time,end_time,measured_at,created_at")
      .eq("patient_id", patientId)
      .eq("biometric_data_type_id", stepsTypeId)
      .lt("start_time", endIso)
      .gt("end_time", startIso)
      .order("start_time", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    let normalizedStepRows = Array.isArray(stepRows)
      ? (stepRows as BiometricDataRow[])
      : [];

    if (normalizedStepRows.length === 0) {
      const { data: fallbackStepRows } = await supabase
        .from("biometric_data")
        .select("value,start_time,end_time,measured_at,created_at")
        .eq("patient_id", patientId)
        .eq("biometric_data_type_id", stepsTypeId)
        .gte("created_at", startIso)
        .lte("created_at", endIso)
        .order("created_at", { ascending: true });

      normalizedStepRows = Array.isArray(fallbackStepRows)
        ? (fallbackStepRows as BiometricDataRow[])
        : [];
    }

    normalizedStepRows.forEach((row) => {
      const startTime = toEpoch(
        row.start_time ?? row.measured_at ?? row.created_at,
      );
      const endTime = toEpoch(
        row.end_time ?? row.start_time ?? row.measured_at ?? row.created_at,
      );
      const value = Number(row.value ?? NaN);

      if (
        startTime === null ||
        endTime === null ||
        !Number.isFinite(value) ||
        endTime < startMs ||
        startTime > endMs
      ) {
        return;
      }

      pointBuckets.steps.push({ timestamp: startTime, value });
    });
  }

  const result = createEmptySeries();
  METRIC_CARDS.forEach((metric) => {
    const sortedPoints = [...pointBuckets[metric.key]].sort(
      (a, b) => a.timestamp - b.timestamp,
    );

    if (sortedPoints.length === 0) return;

    const points = sortedPoints.map((point) =>
      normalizeSeriesPoint(metric.key, point.value),
    );
    const latest = sortedPoints[sortedPoints.length - 1];

    result[metric.key] = {
      points,
      displayValue:
        latest.displayValue ?? formatDisplayValue(metric.key, latest.value),
      pointCount: sortedPoints.length,
    };
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
                    points: [],
                    displayValue: "--",
                    pointCount: 0,
                  };
                  const chartData =
                    data.points.length > 1
                      ? data.points
                      : data.points.length === 1
                        ? [data.points[0], data.points[0]]
                        : [0, 0];

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
                        <Text
                          className={`text-base font-bold font-safiro ${isDark ? "text-white" : "text-black"}`}
                        >
                          {data.displayValue}
                          {metric.unit ? ` ${metric.unit}` : ""}
                        </Text>
                      </View>

                      <View className="flex-1 justify-end">
                        {data.pointCount > 0 ? (
                          <LineChartSlim
                            data={chartData}
                            width={CARD_WIDTH - 24}
                            height={120}
                            lineColor={metric.color}
                            gradientFrom={metric.color}
                            gradientTo={metric.color}
                            gradientFromOpacity={0.26}
                            gradientToOpacity={0}
                            yAxisSuffix={metric.yAxisSuffix}
                            segments={metric.segments}
                            showYLabels={false}
                            {...(metric.yMin !== undefined
                              ? { yMin: metric.yMin }
                              : {})}
                            {...(metric.yMax !== undefined
                              ? { yMax: metric.yMax }
                              : {})}
                          />
                        ) : (
                          <View className="h-[120px] items-center justify-center rounded-2xl bg-black/5">
                            <Text
                              className={`text-xs ${isDark ? "text-white/60" : "text-black/55"}`}
                            >
                              Sem dados neste intervalo
                            </Text>
                          </View>
                        )}
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
  return (
    <QueryClientProvider client={queryClient}>
      <HistoricoDiarioContent />
    </QueryClientProvider>
  );
};

export default HistoricoDiario;
