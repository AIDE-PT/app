import BackButton from "@/components/buttons/backButton";
import LightBackground from "@/components/DotBackground";
import { useTheme } from "@/hooks/useTheme";
import { useHealthMetric, useMetricStats } from "@/hooks/useLatestMetric";
import { useLocalSearchParams } from "expo-router";
import { Stack } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LineChartSlim from "../components/charts/LineChartSlim";
import MainDetails from "../components/details/main";
import "../global.css";

const screenWidth = Dimensions.get("window").width;

// ── Configuration ────────────────────────────────────────────────────────────

type MetricStatus = "normal" | "warning" | "alert";

interface MetricConfig {
  label: string;
  endpoint: string;
  unit: string;
  lineColor: string;
  gradientColor: string;
  yAxisSuffix: string;
  segments: number;
  yMin?: number;
  yMax?: number;
  getStatus: (value: number) => MetricStatus;
  statusLabel: (status: MetricStatus) => string;
  extraCards: (history: number[], stats: { min: number; max: number } | null) => { label: string; value: string; unit: string }[];
  accent: string;
}

const METRIC_CONFIGS: Record<string, MetricConfig> = {
  heart: {
    label: "Batimentos Cardíacos",
    endpoint: "bpm",
    unit: "bpm",
    lineColor: "#748FFC",
    gradientColor: "#748FFC",
    yAxisSuffix: " bpm",
    segments: 4,
    accent: "#748FFC",
    getStatus: (v) => (v >= 60 && v <= 100 ? "normal" : v <= 120 ? "warning" : "alert"),
    statusLabel: (s) => (s === "normal" ? "Normal" : s === "warning" ? "Elevado" : "Crítico"),
    extraCards: (history) => {
      const avg = history.length ? Math.round(history.reduce((a, b) => a + b, 0) / history.length) : 0;
      const resting = history.length ? Math.min(...history) : 0;
      return [
        { label: "Média", value: `${avg}`, unit: "bpm" },
        { label: "Em Repouso", value: `${resting}`, unit: "bpm" },
      ];
    },
  },

  stress: {
    label: "Stress",
    endpoint: "stress",
    unit: "lvl",
    lineColor: "#64748B",
    gradientColor: "#64748B",
    yAxisSuffix: "",
    segments: 4,
    yMin: 0,
    yMax: 100,
    accent: "#64748B",
    getStatus: (v) => (v < 40 ? "normal" : v <= 70 ? "warning" : "alert"),
    statusLabel: (s) => (s === "normal" ? "Baixo" : s === "warning" ? "Moderado" : "Alto"),
    extraCards: (history) => {
      const avg = history.length ? Math.round(history.reduce((a, b) => a + b, 0) / history.length) : 0;
      const resting = history.length ? Math.min(...history) : 0;
      return [
        { label: "Média", value: `${avg}`, unit: "lvl" },
        { label: "Em Repouso", value: `${resting}`, unit: "lvl" },
      ];
    },
  },

  steps: {
    label: "Passos",
    endpoint: "steps",
    unit: "passos",
    lineColor: "#3B82F6",
    gradientColor: "#3B82F6",
    yAxisSuffix: "",
    segments: 4,
    accent: "#3B82F6",
    getStatus: () => "normal",
    statusLabel: () => "Ativo",
    extraCards: (history) => {
      const latest = history.length ? history[0] : 0;
      return [
        { label: "Hoje", value: `${latest.toLocaleString()}`, unit: "passos" },
        { label: "Meta", value: "10 000", unit: "passos" },
      ];
    },
  },

  temp: {
    label: "Temperatura",
    endpoint: "temperature",
    unit: "ºC",
    lineColor: "#F59E0B",
    gradientColor: "#F59E0B",
    yAxisSuffix: " ºC",
    segments: 5,
    yMin: 35,
    yMax: 40,
    accent: "#F59E0B",
    getStatus: (v) => (v >= 36.0 && v <= 37.5 ? "normal" : v <= 38.5 ? "warning" : "alert"),
    statusLabel: (s) => (s === "normal" ? "Normal" : s === "warning" ? "Febre Baixa" : "Febre Alta"),
    extraCards: (history) => {
      const avg = history.length ? (history.reduce((a, b) => a + b, 0) / history.length).toFixed(1) : "0.0";
      return [
        { label: "Média", value: `${avg}`, unit: "ºC" },
        { label: "Normal Corporal", value: "36.5", unit: "ºC" },
      ];
    },
  },

  o2: {
    label: "Saturação de O₂",
    endpoint: "o2",
    unit: "%",
    lineColor: "#06B6D4",
    gradientColor: "#06B6D4",
    yAxisSuffix: "%",
    segments: 4,
    yMin: 88,
    yMax: 100,
    accent: "#06B6D4",
    getStatus: (v) => (v >= 96 ? "normal" : v >= 94 ? "warning" : "alert"),
    statusLabel: (s) => (s === "normal" ? "Normal" : s === "warning" ? "Baixo" : "Crítico"),
    extraCards: (history) => {
      const avg = history.length ? Math.round(history.reduce((a, b) => a + b, 0) / history.length) : 0;
      const resting = history.length ? Math.min(...history) : 0;
      return [
        { label: "Média", value: `${avg}`, unit: "%" },
        { label: "Em Repouso", value: `${resting}`, unit: "%" },
      ];
    },
  },

  glycemia: {
    label: "Glicemia",
    endpoint: "glycemia",
    unit: "mg/dL",
    lineColor: "#F97316",
    gradientColor: "#F97316",
    yAxisSuffix: "",
    segments: 4,
    accent: "#F97316",
    getStatus: (v) => (v >= 70 && v <= 99 ? "normal" : v <= 125 ? "warning" : "alert"),
    statusLabel: (s) => (s === "normal" ? "Normal" : s === "warning" ? "Pré-Diabético" : "Elevado"),
    extraCards: (history) => {
      const avg = history.length ? Math.round(history.reduce((a, b) => a + b, 0) / history.length) : 0;
      const fasting = history.length ? Math.min(...history) : 0;
      return [
        { label: "Média", value: `${avg}`, unit: "mg/dL" },
        { label: "Em Jejum", value: `${fasting}`, unit: "mg/dL" },
      ];
    },
  },
};

// Fallback for unrecognised types — default to BPM
const DEFAULT_TYPE = "heart";
const BRAND_BLUE = "#748FFC";
const HIGHLIGHT_BLUE = "#7C89FF";

// ── Date strip helpers ────────────────────────────────────────────────────────

function buildDays(centerDate: Date): { day: number; weekday: string; month: string }[] {
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const days: { day: number; weekday: string; month: string }[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(centerDate);
    d.setDate(centerDate.getDate() + i);
    days.push({ day: d.getDate(), weekday: weekdays[d.getDay()], month: months[d.getMonth()] });
  }
  return days;
}

// ── Status badge colours ──────────────────────────────────────────────────────

const STATUS_COLORS: Record<MetricStatus, { bg: string; text: string }> = {
  normal:  { bg: "#6BEF8C", text: "#052e16" },
  warning: { bg: "#FDE68A", text: "#78350f" },
  alert:   { bg: "#FECACA", text: "#7f1d1d" },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function MasterDetail() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const resolvedType = (type && METRIC_CONFIGS[type]) ? type : DEFAULT_TYPE;
  const config = METRIC_CONFIGS[resolvedType];

  const { isDark } = useTheme();

  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const days = buildDays(today);

  const { data: metricData, isLoading } = useHealthMetric(config.endpoint);
  const { data: stats } = useMetricStats(config.endpoint);

  // Derived values
  const currentValue = metricData?.latest?.value ?? 0;
  const displayNum = typeof currentValue === "number" ? parseFloat(currentValue.toFixed(1)) : 0;
  const history: number[] = metricData?.history ?? [];
  // history is newest-first; reverse for chronological chart display
  const chartData = history.length >= 2 ? [...history].reverse() : [0, 0];

  const allTimeMin = stats?.min ?? (history.length ? Math.min(...history) : 0);
  const allTimeMax = stats?.max ?? (history.length ? Math.max(...history) : 0);

  const status = config.getStatus(displayNum);
  const statusLabel = config.statusLabel(status);
  const statusColors = STATUS_COLORS[status];

  const extraCards = config.extraCards(history, stats ?? null);

  // ── Render ──────────────────────────────────────────────────────────────────

  const cardBg = isDark ? "bg-aide-dark-card border-white/10" : "bg-white border-gray-100";
  const cardShadow = { boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" } as any;
  const textPrimary = isDark ? "text-white" : "text-black";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-400";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LightBackground>
        <View className="flex-1 px-4 pt-10">
          <SafeAreaView className="flex-1">
            <View className="mb-4">
              <BackButton label={config.label} dark />
            </View>

            {isLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color={config.accent} />
              </View>
            ) : (
              <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 32 }}
              >
                {/* ── Date strip ──────────────────────────────────────── */}
                <View className="mb-6">
                  <Text className={`text-lg font-open-sans text-center mb-4 ${textPrimary}`}>
                    {days[0].day} a {days[days.length - 1].day} de {days[0].month}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 8, gap: 10 }}
                  >
                    {days.map((item) => {
                      const isSelected = selectedDay === item.day;
                      return (
                        <TouchableOpacity
                          key={item.day}
                          onPress={() => setSelectedDay(item.day)}
                          className={`w-14 h-20 rounded-2xl items-center justify-center border ${isDark ? "bg-aide-dark-card border-white/20" : "bg-white"}`}
                          style={[
                            cardShadow,
                            isSelected ? { borderWidth: 2, borderColor: HIGHLIGHT_BLUE, backgroundColor: isDark ? "rgba(124, 137, 255, 0.15)" : "rgba(124, 137, 255, 0.1)" } : undefined,
                          ]}
                        >
                          <Text className={`text-xs font-open-sans mb-1 ${isSelected ? textPrimary : textSecondary}`}>
                            {item.weekday}
                          </Text>
                          <Text className={`text-xl font-bold font-open-sans ${textPrimary}`}>
                            {item.day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* ── Current / Max / Min card (MainDetails) ──────────── */}
                <View className="mb-6">
                  <MainDetails
                    value={displayNum}
                    unit={config.unit}
                    status={status}
                    statusLabel={statusLabel}
                    statusBgColor={statusColors.bg}
                    statusTextColor={statusColors.text}
                    max={allTimeMax}
                    min={allTimeMin}
                  />
                </View>

                {/* ── History chart ────────────────────────────────────── */}
                <View
                  className={`rounded-3xl p-5 border ${cardBg}`}
                  style={cardShadow}
                >
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className={`text-lg font-safiro ${textPrimary}`}>Histórico</Text>
                    <Text className={`text-sm font-open-sans ${textSecondary}`}>Últimas 24h</Text>
                  </View>
                  <LineChartSlim
                    data={chartData}
                    width={screenWidth - 72}
                    height={180}
                    lineColor={config.lineColor}
                    gradientFrom={config.gradientColor}
                    gradientTo={config.gradientColor}
                    gradientFromOpacity={0.3}
                    gradientToOpacity={0}
                    yAxisSuffix={config.yAxisSuffix}
                    segments={config.segments}
                    {...(config.yMin !== undefined ? { yMin: config.yMin } : {})}
                    {...(config.yMax !== undefined ? { yMax: config.yMax } : {})}
                  />
                </View>

                {/* ── Extra info cards ─────────────────────────────────── */}
                <View className="mt-6">
                  <View className="flex-row gap-3">
                    {extraCards.map((card) => (
                      <View
                        key={card.label}
                        className={`flex-1 rounded-2xl p-4 border ${cardBg}`}
                        style={cardShadow}
                      >
                        <Text className={`text-sm font-open-sans mb-1 ${textSecondary}`}>
                          {card.label}
                        </Text>
                        <View className="flex-row items-baseline">
                          <Text className={`text-3xl font-bold font-safiro ${textPrimary}`}>
                            {card.value}
                          </Text>
                          <Text className={`text-sm ml-1 ${textSecondary}`}>
                            {card.unit}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* ── Metric-specific extra section ────────────────────── */}
                {resolvedType === "steps" && (
                  <StepsProgressBar current={displayNum} goal={10000} accent={config.accent} isDark={isDark} />
                )}

                {resolvedType === "stress" && (
                  <StressGauge value={displayNum} isDark={isDark} />
                )}

                {resolvedType === "o2" && (
                  <O2InfoBanner isDark={isDark} />
                )}

              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      </LightBackground>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StepsProgressBar({
  current,
  goal,
  accent,
  isDark,
}: {
  current: number;
  goal: number;
  accent: string;
  isDark: boolean;
}) {
  const pct = Math.min(current / goal, 1);
  const cardBg = isDark ? "bg-aide-dark-card border-white/10" : "bg-white border-gray-100";
  const textPrimary = isDark ? "text-white" : "text-black";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-400";
  return (
    <View
      className={`mt-4 rounded-2xl p-4 border ${cardBg}`}
      style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.12)" } as any}
    >
      <View className="flex-row justify-between mb-2">
        <Text className={`text-sm font-open-sans ${textSecondary}`}>Progresso Diário</Text>
        <Text className={`text-sm font-open-sans font-bold ${textPrimary}`}>
          {Math.round(pct * 100)}%
        </Text>
      </View>
      <View className={`h-3 rounded-full w-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
        <View
          className="h-3 rounded-full"
          style={{ width: `${Math.round(pct * 100)}%`, backgroundColor: accent }}
        />
      </View>
      <Text className={`text-xs mt-2 font-open-sans ${textSecondary}`}>
        {current.toLocaleString()} / {goal.toLocaleString()} passos
      </Text>
    </View>
  );
}

function StressGauge({ value, isDark }: { value: number; isDark: boolean }) {
  const zones = [
    { label: "Baixo", range: "0–39", color: "#6BEF8C" },
    { label: "Moderado", range: "40–70", color: "#FDE68A" },
    { label: "Alto", range: "71–100", color: "#FECACA" },
  ];
  const cardBg = isDark ? "bg-aide-dark-card border-white/10" : "bg-white border-gray-100";
  const textPrimary = isDark ? "text-white" : "text-black";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-400";
  return (
    <View
      className={`mt-4 rounded-2xl p-4 border ${cardBg}`}
      style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.12)" } as any}
    >
      <Text className={`text-sm font-open-sans mb-3 ${textSecondary}`}>Zonas de Stress</Text>
      {zones.map((z) => (
        <View key={z.label} className="flex-row items-center mb-2 gap-3">
          <View className="w-3 h-3 rounded-full" style={{ backgroundColor: z.color }} />
          <Text className={`text-sm font-open-sans ${textPrimary}`}>{z.label}</Text>
          <Text className={`text-sm font-open-sans ml-auto ${textSecondary}`}>{z.range}</Text>
        </View>
      ))}
      <View className={`mt-2 h-[1px] ${isDark ? "bg-white/10" : "bg-gray-100"}`} />
      <Text className={`text-xs mt-2 font-open-sans ${textSecondary}`}>
        Nível atual: <Text className={`font-bold ${textPrimary}`}>{value}</Text>
      </Text>
    </View>
  );
}

function O2InfoBanner({ isDark }: { isDark: boolean }) {
  const cardBg = isDark ? "bg-aide-dark-card border-white/10" : "bg-white border-gray-100";
  const textPrimary = isDark ? "text-white" : "text-black";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-400";
  const rows = [
    { label: "Normal", range: "≥ 96%", color: "#6BEF8C" },
    { label: "Baixo", range: "94 – 95%", color: "#FDE68A" },
    { label: "Crítico", range: "< 94%", color: "#FECACA" },
  ];
  return (
    <View
      className={`mt-4 rounded-2xl p-4 border ${cardBg}`}
      style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.12)" } as any}
    >
      <Text className={`text-sm font-open-sans mb-3 ${textSecondary}`}>Referência de Saturação</Text>
      {rows.map((r) => (
        <View key={r.label} className="flex-row items-center mb-2 gap-3">
          <View className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
          <Text className={`text-sm font-open-sans ${textPrimary}`}>{r.label}</Text>
          <Text className={`text-sm font-open-sans ml-auto ${textSecondary}`}>{r.range}</Text>
        </View>
      ))}
    </View>
  );
}
