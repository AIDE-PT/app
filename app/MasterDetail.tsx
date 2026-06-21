import BackButton from "@/components/buttons/backButton";
import LineChartSlim from "@/components/charts/LineChartSlim";
import LightBackground from "@/components/DotBackground";
import {
  useHealthMetric,
  useMetricHistory,
  useMetricStats,
} from "@/hooks/useLatestMetric";
import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import "../global.css";

const { width: screenWidth } = Dimensions.get("window");

// ─── Types ───────────────────────────────────────────────────────────────────
type MetricStatus = "normal" | "warning" | "alert";
interface ExtraCard {
  label: string;
  value: string;
  unit: string;
  icon: string;
}
interface MetricConfig {
  label: string;
  endpoint: string;
  displayUnit: string;
  lineColor: string;
  gradientColor: string;
  yAxisSuffix: string;
  segments: number;
  yMin?: number;
  yMax?: number;
  accent: string;
  accentLight: string;
  getStatus: (v: number) => MetricStatus;
  statusLabel: (s: MetricStatus) => string;
  extraCards: (
    h: number[],
    s: { min: number; max: number } | null,
    current: number,
  ) => ExtraCard[];
  formatValue: (v: number) => string;
}

interface MetricBand {
  label: string;
  min: number;
  max: number;
  color: string;
}

interface MetricScale {
  min: number;
  max: number;
  bands: MetricBand[];
}

type PatternLevel = "low" | "medium" | "high";
type HistoryRange = "day" | "week" | "month";
const RANGE_TABS: readonly { key: HistoryRange; label: string }[] = [
  { key: "day", label: "Dia" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mês" },
];
const RANGE_NAV_PADDING = 4;

// Agrega os pontos {valor, timestamp} em buckets temporais adequados à janela:
// dia → 24 buckets horários, semana → 7 diários, mês → 30 diários. Alinhados ao
// tempo real (não por posição). mode "sum" para métricas cumulativas (passos,
// calorias), "avg" para médias. Buckets vazios: 0 nas cumulativas; nas médias
// arrasta o último valor conhecido (carry-forward) para a linha não cair a 0.
// Devolve valores + rótulos em ordem cronológica (antigo → recente).
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEKDAY_SHORT_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const bucketLabel = (t: number, range: HistoryRange) => {
  const d = new Date(t);
  if (range === "day") {
    return new Intl.DateTimeFormat("pt-PT", { hour: "2-digit" }).format(d);
  }
  if (range === "week") {
    return WEEKDAY_SHORT_PT[d.getDay()];
  }
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
  }).format(d);
};
const aggregateByRange = (
  points: { value: number; t: number }[],
  range: HistoryRange,
  mode: "sum" | "avg",
): {
  values: number[];
  labels: string[];
  counts: number[];
  mins: number[];
  maxs: number[];
} => {
  const now = Date.now();
  const bucketCount = range === "day" ? 24 : range === "week" ? 7 : 30;
  const bucketMs = range === "day" ? HOUR_MS : DAY_MS;
  const windowStart = now - bucketCount * bucketMs;

  const sums = new Array(bucketCount).fill(0);
  const counts = new Array(bucketCount).fill(0);
  const mins = new Array(bucketCount).fill(Number.NaN);
  const maxs = new Array(bucketCount).fill(Number.NaN);
  points.forEach((p) => {
    if (p.t < windowStart || p.t > now) return;
    const idx = Math.min(
      bucketCount - 1,
      Math.max(0, Math.floor((p.t - windowStart) / bucketMs)),
    );
    sums[idx] += p.value;
    counts[idx] += 1;
    mins[idx] = Number.isFinite(mins[idx])
      ? Math.min(mins[idx], p.value)
      : p.value;
    maxs[idx] = Number.isFinite(maxs[idx])
      ? Math.max(maxs[idx], p.value)
      : p.value;
  });

  const values: number[] = new Array(bucketCount).fill(0);
  let lastAvg = 0;
  let seen = false;
  for (let i = 0; i < bucketCount; i++) {
    if (counts[i] > 0) {
      values[i] = mode === "sum" ? sums[i] : sums[i] / counts[i];
      if (mode === "avg") {
        lastAvg = values[i];
        seen = true;
      }
    } else {
      values[i] = mode === "avg" && seen ? lastAvg : 0;
    }
  }

  const labels = values.map((_, i) =>
    bucketLabel(windowStart + i * bucketMs + bucketMs / 2, range),
  );
  return { values, labels, counts, mins, maxs };
};

// Mantém ~6 marcas no eixo X (resto vazio) para não encavalitar os rótulos.
const thinLabels = (labels: string[], range?: HistoryRange): string[] => {
  const n = labels.length;
  if (n < 2) return [];
  if (range === "week") return labels;
  const tickCount = Math.min(6, n);
  const keep = new Set<number>();
  for (let i = 0; i < tickCount; i++) {
    keep.add(Math.round((i * (n - 1)) / (tickCount - 1)));
  }
  return labels.map((l, i) => (keep.has(i) ? l : ""));
};

type DayGroup = {
  t: number;
  avg: number;
  min: number;
  max: number;
  count: number;
};

function groupByCalendarDay(
  points: { value: number; t: number }[],
): DayGroup[] {
  const map = new Map<number, number[]>();
  for (const p of points) {
    if (!Number.isFinite(p.value) || !Number.isFinite(p.t)) continue;
    const d = new Date(p.t);
    d.setHours(0, 0, 0, 0);
    const key = d.getTime();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p.value);
  }
  return Array.from(map.entries())
    .map(([t, values]) => ({
      t,
      avg: values.reduce((s, v) => s + v, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    }))
    .sort((a, b) => a.t - b.t);
}

interface PatternIndicator {
  level: PatternLevel;
  label: string;
  icon: "chevron-down" | "minus" | "chevron-up";
  color: string;
}

const calcAvg = (arr: number[]) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const announceEntryValue = (label: string) => {
  AccessibilityInfo.announceForAccessibility(label);
};

const getRelativeDayLabel = (daysAgo: number) => {
  const targetDate = new Date();
  targetDate.setHours(0, 0, 0, 0);
  targetDate.setDate(targetDate.getDate() - Math.max(0, daysAgo));
  return Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(targetDate);
};

const getRangeAxisLabels = (range: HistoryRange, points: number) => {
  const span = Math.max(points - 1, 1);
  if (range === "day") return { start: `-${span}h`, end: "agora" };
  return { start: `-${span}d`, end: "hoje" };
};

const getRangeEntryTimeLabel = (range: HistoryRange, offset: number) => {
  const safeOffset = Math.max(0, offset);
  if (range === "day") {
    if (safeOffset === 0) return "Agora";
    return `Há ${safeOffset} ${safeOffset === 1 ? "hora" : "horas"}`;
  }
  return getRelativeDayLabel(safeOffset);
};

function getTrendText({
  history,
  current,
}: {
  history: number[];
  current: number;
}) {
  if (history.length < 2) return "Tendencia: dados insuficientes.";

  const previousWindow = history.slice(1, 6);
  const previousAvg = previousWindow.length
    ? calcAvg(previousWindow)
    : history[history.length - 1];

  if (previousAvg === 0)
    return "Tendencia: sem referencia suficiente para comparar.";

  const delta = current - previousAvg;
  const relativeDelta = (delta / Math.abs(previousAvg)) * 100;
  const absRelativeDelta = Math.abs(relativeDelta);

  if (absRelativeDelta < 3) {
    return "Tendencia: estavel nas leituras recentes.";
  }

  return `Tendencia: ${delta > 0 ? "a subir" : "a descer"} (variacao de ${absRelativeDelta.toFixed(0)}%).`;
}

function getZoneSummary(type: string, value: number) {
  switch (type) {
    case "heart":
      if (value < 60) return "Zona atual: repouso.";
      if (value <= 100) return "Zona atual: normal.";
      if (value <= 140) return "Zona atual: elevado.";
      return "Zona atual: maximo.";
    case "stress":
      if (value < 40) return "Zona atual: baixo.";
      if (value <= 70) return "Zona atual: moderado.";
      return "Zona atual: alto.";
    case "temp":
      if (value < 36) return "Zona atual: hipotermia.";
      if (value <= 37.5) return "Zona atual: normal.";
      if (value <= 38.5) return "Zona atual: febre baixa.";
      return "Zona atual: febre alta.";
    case "o2":
      if (value >= 96) return "Zona atual: oxigenacao normal.";
      if (value >= 94) return "Zona atual: oxigenacao baixa.";
      return "Zona atual: oxigenacao critica.";
    case "steps":
      return "Objetivo diario recomendado: 10 000 passos.";
    case "glycemia":
      return "Meta diaria de calorias: 2 000 kcal.";
    default:
      return "";
  }
}

function getStepsPatternIndicator(
  value: number,
  semantic: { success: string; warning: string; danger: string },
): PatternIndicator {
  if (value < 7000) {
    return {
      level: "low",
      label: "baixo",
      icon: "chevron-down",
      color: semantic.warning,
    };
  }

  if (value <= 10000) {
    return {
      level: "medium",
      label: "moderado",
      icon: "minus",
      color: semantic.success,
    };
  }

  return {
    level: "high",
    label: "alto",
    icon: "chevron-up",
    color: "#60A5FA",
  };
}

function getO2PatternIndicator(
  value: number,
  semantic: { success: string; warning: string; danger: string },
): PatternIndicator {
  if (value < 94) {
    return {
      level: "low",
      label: "baixo",
      icon: "chevron-down",
      color: semantic.danger,
    };
  }

  if (value < 96) {
    return {
      level: "medium",
      label: "moderado",
      icon: "minus",
      color: semantic.warning,
    };
  }

  return {
    level: "high",
    label: "alto",
    icon: "chevron-up",
    color: semantic.success,
  };
}

function getHeartPatternIndicator(
  value: number,
  semantic: { success: string; warning: string; danger: string },
): PatternIndicator {
  if (value < 60) {
    return {
      level: "low",
      label: "baixo",
      icon: "chevron-down",
      color: "#93C5FD",
    };
  }

  if (value <= 100) {
    return {
      level: "medium",
      label: "normal",
      icon: "minus",
      color: semantic.success,
    };
  }

  return {
    level: "high",
    label: value <= 140 ? "elevado" : "critico",
    icon: "chevron-up",
    color: value <= 140 ? semantic.warning : semantic.danger,
  };
}

function buildAccessibleSummary({
  type,
  config,
  current,
  statusLabel,
  history,
  allTimeMin,
  allTimeMax,
}: {
  type: string;
  config: MetricConfig;
  current: number;
  statusLabel: string;
  history: number[];
  allTimeMin: number;
  allTimeMax: number;
}) {
  const speechUnit =
    config.displayUnit === "%" ? "por cento" : config.displayUnit;
  const toSpeechNumber = (value: string) =>
    value
      .replace(/\s+/g, "")
      .replace(/[,.]/g, " virgula ")
      .replace(/\s+/g, " ")
      .trim();
  const valueText = `${toSpeechNumber(config.formatValue(current))}${speechUnit ? ` ${speechUnit}` : ""}`;
  const rangeText = `${toSpeechNumber(config.formatValue(allTimeMin))}${speechUnit ? ` ${speechUnit}` : ""} ate ${toSpeechNumber(config.formatValue(allTimeMax))}${speechUnit ? ` ${speechUnit}` : ""}`;
  const recentReadings = history
    .slice(0, 5)
    .map(
      (v) =>
        `${toSpeechNumber(config.formatValue(v))}${speechUnit ? ` ${speechUnit}` : ""}`,
    );

  const lines = [
    `Valor atual: ${valueText}.`,
    `Estado: ${statusLabel}.`,
    getTrendText({ history, current }),
    `Intervalo observado: ${rangeText}.`,
    getZoneSummary(type, current),
    recentReadings.length
      ? `Ultimas leituras: ${recentReadings.join(", ")}.`
      : "Ultimas leituras: indisponiveis.",
  ].filter(Boolean);

  return {
    title: `Resumo acessivel de ${config.label}`,
    lines,
    accessibilityLabel: [`Resumo acessivel de ${config.label}.`, ...lines].join(
      " ",
    ),
  };
}

// ─── Metric Configurations ────────────────────────────────────────────────────
const METRIC_CONFIGS: Record<string, MetricConfig> = {
  heart: {
    label: "Batimentos Cardíacos",
    endpoint: "bpm",
    displayUnit: "bpm",
    lineColor: "#7C89FF",
    gradientColor: "#7C89FF",
    yAxisSuffix: " bpm",
    segments: 4,
    accent: "#7C89FF",
    accentLight: "#E8EAFF",
    formatValue: (v) => Math.round(v).toString(),
    getStatus: (v) =>
      v >= 60 && v <= 100 ? "normal" : v <= 120 ? "warning" : "alert",
    statusLabel: (s) =>
      s === "normal" ? "Normal" : s === "warning" ? "Elevado" : "Crítico",
    extraCards: (h) => [],
  },
  stress: {
    label: "Nível de Stress",
    endpoint: "stress",
    displayUnit: "",
    lineColor: "#7C89FF",
    gradientColor: "#7C89FF",
    yAxisSuffix: "",
    segments: 4,
    yMin: 0,
    yMax: 100,
    accent: "#7C89FF",
    accentLight: "#E8EAFF",
    formatValue: (v) => Math.round(v).toString(),
    getStatus: (v) => (v < 40 ? "normal" : v <= 70 ? "warning" : "alert"),
    statusLabel: (s) =>
      s === "normal" ? "Baixo" : s === "warning" ? "Moderado" : "Alto",
    extraCards: (h) => [],
  },
  steps: {
    label: "Passos",
    endpoint: "steps",
    displayUnit: "passos",
    lineColor: "#7C89FF",
    gradientColor: "#7C89FF",
    yAxisSuffix: "",
    segments: 4,
    accent: "#7C89FF",
    accentLight: "#E8EAFF",
    formatValue: (v) => Math.round(v).toLocaleString("pt-PT"),
    getStatus: () => "normal",
    statusLabel: () => "Ativo",
    extraCards: (h) => [],
  },
  temp: {
    label: "Temperatura Corporal",
    endpoint: "temperature",
    displayUnit: "ºC",
    lineColor: "#7C89FF",
    gradientColor: "#7C89FF",
    yAxisSuffix: " ºC",
    segments: 5,
    yMin: 35,
    yMax: 40,
    accent: "#7C89FF",
    accentLight: "#E8EAFF",
    formatValue: (v) => v.toFixed(1),
    getStatus: (v) =>
      v >= 36.0 && v <= 37.5 ? "normal" : v <= 38.5 ? "warning" : "alert",
    statusLabel: (s) =>
      s === "normal"
        ? "Normal"
        : s === "warning"
          ? "Febre Baixa"
          : "Febre Alta",
    extraCards: (h) => [
      {
        label: "Média",
        value: calcAvg(h).toFixed(1),
        unit: "ºC",
        icon: "thermometer",
      },
    ],
  },
  o2: {
    label: "Saturação de O₂",
    endpoint: "o2",
    displayUnit: "%",
    lineColor: "#7C89FF",
    gradientColor: "#7C89FF",
    yAxisSuffix: "%",
    segments: 4,
    yMin: 88,
    yMax: 100,
    accent: "#7C89FF",
    accentLight: "#E8EAFF",
    formatValue: (v) => Math.round(v).toString(),
    getStatus: (v) => (v >= 96 ? "normal" : v >= 94 ? "warning" : "alert"),
    statusLabel: (s) =>
      s === "normal" ? "Normal" : s === "warning" ? "Baixo" : "Crítico",
    extraCards: (h) => [],
  },
  glycemia: {
    label: "Calorias",
    endpoint: "glycemia",
    displayUnit: "kcal",
    lineColor: "#7C89FF",
    gradientColor: "#7C89FF",
    yAxisSuffix: "",
    segments: 4,
    accent: "#7C89FF",
    accentLight: "#E8EAFF",
    formatValue: (v) => Math.round(v).toString(),
    getStatus: (v) => (v < 1500 ? "warning" : v <= 2200 ? "normal" : "alert"),
    statusLabel: (s) =>
      s === "normal" ? "Na Meta" : s === "warning" ? "Abaixo" : "Acima",
    extraCards: (h) => [
      {
        label: "Queimadas",
        value: Math.round(calcAvg(h)).toString(),
        unit: "kcal",
        icon: "zap",
      },
      { label: "Meta", value: "2 000", unit: "kcal", icon: "flag" },
      {
        label: "Progresso",
        value: `${Math.min(Math.round((calcAvg(h) / 2000) * 100), 100)}`,
        unit: "%",
        icon: "percent",
      },
    ],
  },
  bloodPressure: {
    label: "Pressão Arterial",
    endpoint: "bloodPressure",
    displayUnit: "mmHg",
    lineColor: "#F87171",
    gradientColor: "#F87171",
    yAxisSuffix: " mmHg",
    segments: 4,
    yMin: 60,
    yMax: 180,
    accent: "#F87171",
    accentLight: "#FEE2E2",
    formatValue: (v) => Math.round(v).toString(),
    getStatus: (v) => (v < 120 ? "normal" : v < 140 ? "warning" : "alert"),
    statusLabel: (s) =>
      s === "normal" ? "Normal" : s === "warning" ? "Elevada" : "Crítica",
    extraCards: (h) => [
      {
        label: "Média",
        value: Math.round(calcAvg(h)).toString(),
        unit: "mmHg",
        icon: "activity",
      },
    ],
  },
  sleep: {
    label: "Sono",
    endpoint: "sleep",
    displayUnit: "h",
    lineColor: "#818CF8",
    gradientColor: "#818CF8",
    yAxisSuffix: "h",
    segments: 4,
    yMin: 0,
    yMax: 12,
    accent: "#818CF8",
    accentLight: "#E0E7FF",
    formatValue: (v) => v.toFixed(1),
    getStatus: (v) =>
      v >= 7 && v <= 9 ? "normal" : v >= 6 ? "warning" : "alert",
    statusLabel: (s) =>
      s === "normal"
        ? "Adequado"
        : s === "warning"
          ? "Insuficiente"
          : "Privação",
    extraCards: (h) => [
      {
        label: "Média",
        value: calcAvg(h).toFixed(1),
        unit: "h",
        icon: "moon",
      },
    ],
  },
  cal: {
    label: "Calorias",
    endpoint: "cal",
    displayUnit: "kcal",
    lineColor: "#FB923C",
    gradientColor: "#FB923C",
    yAxisSuffix: "",
    segments: 4,
    accent: "#FB923C",
    accentLight: "#FFEDD5",
    formatValue: (v) => Math.round(v).toString(),
    getStatus: (v) => (v < 1500 ? "warning" : v <= 2200 ? "normal" : "alert"),
    statusLabel: (s) =>
      s === "normal" ? "Na Meta" : s === "warning" ? "Abaixo" : "Acima",
    extraCards: (h) => [
      {
        label: "Queimadas",
        value: Math.round(calcAvg(h)).toString(),
        unit: "kcal",
        icon: "zap",
      },
      { label: "Meta", value: "2 000", unit: "kcal", icon: "flag" },
      {
        label: "Progresso",
        value: `${Math.min(Math.round((calcAvg(h) / 2000) * 100), 100)}`,
        unit: "%",
        icon: "percent",
      },
    ],
  },
};

const DEFAULT_TYPE = "heart";

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  const safeHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  return {
    r: parseInt(safeHex.slice(0, 2), 16),
    g: parseInt(safeHex.slice(2, 4), 16),
    b: parseInt(safeHex.slice(4, 6), 16),
  };
};

const toRgba = (hex: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
};

const mixHex = (source: string, target: string, weight: number) => {
  const from = hexToRgb(source);
  const to = hexToRgb(target);
  const mix = (start: number, end: number) =>
    Math.round(start + (end - start) * weight);

  return `rgb(${mix(from.r, to.r)}, ${mix(from.g, to.g)}, ${mix(from.b, to.b)})`;
};

const buildStatusPalette = (
  semantic: {
    success: string;
    warning: string;
    danger: string;
  },
  isDark: boolean,
): Record<MetricStatus, { bg: string; text: string; border: string }> => ({
  normal: {
    bg: toRgba(semantic.success, isDark ? 0.18 : 0.12),
    text: isDark ? semantic.success : mixHex(semantic.success, "#111827", 0.62),
    border: toRgba(semantic.success, isDark ? 0.42 : 0.28),
  },
  warning: {
    bg: toRgba(semantic.warning, isDark ? 0.18 : 0.14),
    text: isDark ? semantic.warning : mixHex(semantic.warning, "#111827", 0.62),
    border: toRgba(semantic.warning, isDark ? 0.42 : 0.3),
  },
  alert: {
    bg: toRgba(semantic.danger, isDark ? 0.18 : 0.12),
    text: isDark ? semantic.danger : mixHex(semantic.danger, "#111827", 0.62),
    border: toRgba(semantic.danger, isDark ? 0.42 : 0.28),
  },
});

function getStandardizedMetricScale(
  type: string,
  semantic: { success: string; warning: string; danger: string },
  rangeDays: number = 1,
): MetricScale {
  switch (type) {
    case "heart":
      return {
        min: 40,
        max: 180,
        bands: [
          { label: "Repouso", min: 40, max: 60, color: "#93C5FD" },
          { label: "Normal", min: 60, max: 100, color: semantic.success },
          { label: "Elevado", min: 100, max: 140, color: semantic.warning },
          { label: "Máximo", min: 140, max: 180, color: semantic.danger },
        ],
      };
    case "stress":
      return {
        min: 0,
        max: 100,
        bands: [
          { label: "Baixo", min: 0, max: 40, color: semantic.success },
          { label: "Moderado", min: 40, max: 70, color: semantic.warning },
          { label: "Alto", min: 70, max: 100, color: semantic.danger },
        ],
      };
    case "steps":
      const stepScaleDays = Math.max(1, rangeDays);
      return {
        min: 0,
        max: 14000 * stepScaleDays,
        bands: [
          {
            label: "Abaixo",
            min: 0,
            max: 7000 * stepScaleDays,
            color: semantic.warning,
          },
          {
            label: "Na Meta",
            min: 7000 * stepScaleDays,
            max: 10000 * stepScaleDays,
            color: semantic.success,
          },
          {
            label: "Acima",
            min: 10000 * stepScaleDays,
            max: 14000 * stepScaleDays,
            color: "#93C5FD",
          },
        ],
      };
    case "temp":
      return {
        min: 35,
        max: 40,
        bands: [
          { label: "Baixa", min: 35, max: 36, color: "#93C5FD" },
          { label: "Normal", min: 36, max: 37.5, color: semantic.success },
          { label: "Alta", min: 37.5, max: 40, color: semantic.warning },
        ],
      };
    case "o2":
      return {
        min: 85,
        max: 100,
        bands: [
          { label: "Crítico", min: 85, max: 94, color: semantic.danger },
          { label: "Baixo", min: 94, max: 96, color: semantic.warning },
          { label: "Normal", min: 96, max: 100, color: semantic.success },
        ],
      };
    case "glycemia":
      return {
        min: 0,
        max: 2600,
        bands: [
          { label: "Abaixo", min: 0, max: 1500, color: semantic.warning },
          { label: "Na Meta", min: 1500, max: 2200, color: semantic.success },
          { label: "Acima", min: 2200, max: 2600, color: semantic.danger },
        ],
      };
    case "bloodPressure":
      return {
        min: 60,
        max: 180,
        bands: [
          { label: "Normal", min: 60, max: 120, color: semantic.success },
          { label: "Elevada", min: 120, max: 140, color: semantic.warning },
          { label: "Crítica", min: 140, max: 180, color: semantic.danger },
        ],
      };
    case "sleep":
      return {
        min: 0,
        max: 12,
        bands: [
          { label: "Privação", min: 0, max: 6, color: semantic.danger },
          { label: "Insuficiente", min: 6, max: 7, color: semantic.warning },
          { label: "Adequado", min: 7, max: 12, color: semantic.success },
        ],
      };
    case "cal":
      return {
        min: 0,
        max: 2600,
        bands: [
          { label: "Abaixo", min: 0, max: 1500, color: semantic.warning },
          { label: "Na Meta", min: 1500, max: 2200, color: semantic.success },
          { label: "Acima", min: 2200, max: 2600, color: semantic.danger },
        ],
      };
    default:
      return {
        min: 0,
        max: 100,
        bands: [
          { label: "Baixo", min: 0, max: 33, color: semantic.success },
          { label: "Médio", min: 33, max: 66, color: semantic.warning },
          { label: "Alto", min: 66, max: 100, color: semantic.danger },
        ],
      };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIQUE VISUALIZATIONS PER METRIC
// ═══════════════════════════════════════════════════════════════════════════════

// ─── HEART: Triple concentric rings (rest / normal / elevated zones) ──────────
function HeartTripleRings({
  value,
  isDark,
  centerLabel = "bpm",
  semantic,
}: {
  value: number;
  isDark: boolean;
  centerLabel?: string;
  semantic: { success: string; warning: string; danger: string };
}) {
  const size = 220;
  const cx = size / 2,
    cy = size / 2;
  const trackColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.14)";
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const rings = [
    { r: 46, min: 0, max: 40, color: semantic.success, label: "Baixo" },
    { r: 66, min: 40, max: 70, color: semantic.warning, label: "Moderado" },
    { r: 86, min: 70, max: 100, color: semantic.danger, label: "Alto" },
  ];
  const ringPct = (min: number, max: number) => {
    if (value <= min) return 0;
    if (value >= max) return 1;
    return (value - min) / (max - min);
  };
  const inactiveStroke = isDark ? 7 : 8;
  const activeStroke = isDark ? 9 : 10;
  return (
    <Svg width={size} height={size}>
      <Defs>
        {rings.map((ring, i) => (
          <LinearGradient key={i} id={`hg${i}`} x1="0" y1="0" x2="1" y2="0">
            <Stop
              offset="0%"
              stopColor={ring.color}
              stopOpacity={isDark ? 0.5 : 0.82}
            />
            <Stop
              offset="100%"
              stopColor={ring.color}
              stopOpacity={isDark ? 1 : 0.98}
            />
          </LinearGradient>
        ))}
      </Defs>
      {rings.map((ring, i) => {
        const circ = 2 * Math.PI * ring.r;
        const pct = ringPct(ring.min, ring.max);
        const isActive = value >= ring.min && value < ring.max;
        const dotAngle = -90 + 360 * pct;
        const dotX = cx + ring.r * Math.cos(toRad(dotAngle));
        const dotY = cy + ring.r * Math.sin(toRad(dotAngle));
        return (
          <G key={ring.label}>
            <Circle
              cx={cx}
              cy={cy}
              r={ring.r}
              fill="none"
              stroke={trackColor}
              strokeWidth={isActive ? activeStroke : inactiveStroke}
            />
            {pct > 0 && (
              <Circle
                cx={cx}
                cy={cy}
                r={ring.r}
                fill="none"
                stroke={`url(#hg${i})`}
                strokeWidth={isActive ? activeStroke : inactiveStroke}
                strokeLinecap="round"
                strokeDasharray={`${circ * pct} ${circ}`}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            )}
            {isActive && pct > 0 && (
              <>
                <Circle cx={dotX} cy={dotY} r={6} fill={ring.color} />
                <Circle cx={dotX} cy={dotY} r={3} fill="white" />
              </>
            )}
          </G>
        );
      })}
      <SvgText
        x={cx}
        y={cy - 10}
        fontSize="38"
        fontWeight="800"
        fill={isDark ? "#FFF" : "#111827"}
        textAnchor="middle"
      >
        {Math.round(value)}
      </SvgText>
      <SvgText
        x={cx}
        y={cy + 14}
        fontSize="13"
        fill={isDark ? "rgba(255,255,255,0.62)" : "#6B7280"}
        textAnchor="middle"
      >
        {centerLabel}
      </SvgText>
      {rings.map((ring) => (
        <SvgText
          key={ring.label}
          x={cx + ring.r + 8}
          y={cy + 4}
          fontSize="8.5"
          fill={isDark ? "rgba(255,255,255,0.56)" : "#6B7280"}
          textAnchor="start"
        >
          {ring.label}
        </SvgText>
      ))}
    </Svg>
  );
}

// ─── O2: Semi-circle gauge with colored zones ─────────────────────────────────
function O2RangeColumns({
  values,
  mins,
  maxs,
  counts,
  range,
  isDark,
  semantic,
}: {
  values: number[];
  mins: number[];
  maxs: number[];
  counts: number[];
  range: HistoryRange;
  isDark: boolean;
  semantic: { success: string; warning: string; danger: string };
}) {
  const W = screenWidth - 56;
  const H = 220;
  const pL = 58,
    pR = 22,
    pT = 12,
    pB = range === "week" ? 38 : 32;
  const cW = W - pL - pR;
  const cH = H - pT - pB;
  const yMin = 85,
    yMax = 100;

  const bucketCount = range === "day" ? 24 : range === "week" ? 7 : 30;
  const buckets = Array.from({ length: bucketCount }, (_, i) => {
    const measured = (counts[i] ?? 0) > 0;
    const avg = values[i] ?? Number.NaN;
    const lo = Number.isFinite(mins[i]) ? mins[i] : avg;
    const hi = Number.isFinite(maxs[i]) ? maxs[i] : avg;
    return {
      lo,
      hi,
      measured,
      single: Math.abs(hi - lo) < 0.1,
    };
  });
  const hasMeasuredBuckets = buckets.some((bucket) => bucket.measured);

  const toY = (v: number) =>
    pT + cH * (1 - (Math.min(Math.max(v, yMin), yMax) - yMin) / (yMax - yMin));
  const toX = (i: number) =>
    pL + (bucketCount > 1 ? (i / (bucketCount - 1)) * cW : cW / 2);

  const barW = Math.max(3, (cW / bucketCount) * 0.55);
  const dotR = Math.max(2.5, barW * 0.55);

  // Y-axis grid lines
  const yTicks = [85, 90, 95, 100];
  const textColor = isDark ? "rgba(255,255,255,0.62)" : "#6B7280";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const barColor = "#7C89FF";
  const axisLabels = getRangeAxisLabels(range, bucketCount);
  const xLabels =
    range === "week"
      ? Array.from({ length: bucketCount }, (_, i) =>
          bucketLabel(Date.now() - (bucketCount - 1 - i) * DAY_MS, range),
        )
      : null;

  if (!hasMeasuredBuckets) {
    return (
      <View
        style={{ width: W, height: H }}
        className="items-center justify-center"
      >
        <Text className="text-sm font-open-sans" style={{ color: textColor }}>
          Sem dados neste intervalo
        </Text>
      </View>
    );
  }

  return (
    <View style={{ width: W, height: H, position: "relative" }}>
      <Svg width={W} height={H}>
        {/* Grid lines + Y labels */}
        {yTicks.map((t) => {
          const y = toY(t);
          return (
            <G key={t}>
              <Line
                x1={pL}
                y1={y}
                x2={W - pR}
                y2={y}
                stroke={gridColor}
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <SvgText
                x={pL - 16}
                y={y + 4}
                fontSize="8.5"
                fill={textColor}
                textAnchor="end"
              >
                {t}
              </SvgText>
            </G>
          );
        })}
        {/* Range columns */}
        {buckets.map((b, i) => {
          if (!b.measured) return null;
          const x = toX(i);
          const yLo = toY(b.lo);
          const yHi = toY(b.hi);
          if (b.single) {
            // Single dot when lo === hi
            return (
              <Circle
                key={i}
                cx={x}
                cy={yHi}
                r={dotR}
                fill={barColor}
                opacity={0.85}
              />
            );
          }
          return (
            <G key={i}>
              {/* Vertical bar */}
              <Rect
                x={x - barW / 2}
                y={yHi}
                width={barW}
                height={yLo - yHi}
                rx={barW / 2}
                fill={barColor}
                opacity={0.8}
              />
              {/* Top dot */}
              <Circle cx={x} cy={yHi} r={dotR} fill={barColor} />
              {/* Bottom dot */}
              <Circle cx={x} cy={yLo} r={dotR} fill={barColor} />
            </G>
          );
        })}
        {/* X-axis baseline */}
        <Line
          x1={pL}
          y1={H - pB}
          x2={W - pR}
          y2={H - pB}
          stroke={gridColor}
          strokeWidth="1"
        />
        {xLabels ? (
          xLabels.map((label, i) => (
            <SvgText
              key={`${label}-${i}`}
              x={toX(i)}
              y={H - pB + 16}
              fontSize="8.5"
              fill={textColor}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          ))
        ) : (
          <>
            <SvgText
              x={pL}
              y={H - pB + 14}
              fontSize="9"
              fill={textColor}
              textAnchor="start"
            >
              {axisLabels.start}
            </SvgText>
            <SvgText
              x={W - pR}
              y={H - pB + 14}
              fontSize="9"
              fill={textColor}
              textAnchor="end"
            >
              {axisLabels.end}
            </SvgText>
          </>
        )}
      </Svg>

      {buckets.map((b, i) => {
        if (!b.measured) return null;
        const x = toX(i);
        const yLo = toY(b.lo);
        const yHi = toY(b.hi);
        const daysAgo = bucketCount - 1 - i;
        const midpoint = (b.lo + b.hi) / 2;
        const indicator = getO2PatternIndicator(midpoint, semantic);
        const pointTimeLabel = getRangeEntryTimeLabel(range, daysAgo);
        const entryLabel = b.single
          ? `${pointTimeLabel}. Saturação ${Math.round(b.hi)} por cento. Indicador ${indicator.label}.`
          : `${pointTimeLabel}. Intervalo de saturação de ${Math.round(b.lo)} a ${Math.round(b.hi)} por cento. Indicador ${indicator.label}.`;
        const hitTop = b.single ? Math.max(0, yHi - 14) : yHi;
        const hitHeight = b.single ? 28 : Math.max(28, yLo - yHi);
        return (
          <Pressable
            key={`o2-hit-${i}`}
            style={[
              styles.chartHit,
              {
                left: x - Math.max(barW, 24) / 2,
                top: hitTop,
                width: Math.max(barW, 24),
                height: hitHeight,
              },
            ]}
            accessible
            focusable
            importantForAccessibility="yes"
            accessibilityRole="text"
            accessibilityLabel={entryLabel}
            accessibilityHint="Toque duas vezes para ouvir o valor desta barra."
            onPress={() => announceEntryValue(entryLabel)}
            onAccessibilityTap={() => announceEntryValue(entryLabel)}
          />
        );
      })}

      {buckets.map((b, i) => {
        if (!b.measured) return null;
        const x = toX(i);
        const yHi = toY(b.hi);
        const indicator = getO2PatternIndicator((b.lo + b.hi) / 2, semantic);
        return (
          <View
            key={`o2-pattern-${i}`}
            pointerEvents="none"
            accessible={false}
            style={{
              position: "absolute",
              left: x - 8,
              top: Math.max(2, yHi - 18),
              width: 16,
              height: 16,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isDark
                ? "rgba(15,23,42,0.82)"
                : "rgba(255,255,255,0.92)",
            }}
          >
            <Feather name={indicator.icon} size={10} color={indicator.color} />
          </View>
        );
      })}
    </View>
  );
}

// ─── GENERIC INTERVAL: Range bar (min→max) + avg dot per bucket ───────────────
function MetricRangeBars({
  groups,
  yMin: yMinProp,
  yMax: yMaxProp,
  range,
  isDark,
  accentColor,
}: {
  groups: DayGroup[];
  yMin?: number;
  yMax?: number;
  range: HistoryRange;
  isDark: boolean;
  accentColor: string;
}) {
  if (!groups.length) return null;
  const W = screenWidth - 80;
  const H = 200;
  const pL = 36,
    pR = 10,
    pT = 14,
    pB = 32;
  const cW = W - pL - pR;
  const cH = H - pT - pB;

  const allMins = groups.map((g) => g.min);
  const allMaxs = groups.map((g) => g.max);
  const dataMin = Math.min(...allMins);
  const dataMax = Math.max(...allMaxs);
  const padding = Math.max((dataMax - dataMin) * 0.15, 1);
  const yMin = yMinProp ?? Math.max(0, dataMin - padding);
  const yMax = yMaxProp ?? dataMax + padding;
  const yRange = Math.max(yMax - yMin, 1);

  const toY = (v: number) =>
    pT + cH * (1 - (Math.min(Math.max(v, yMin), yMax) - yMin) / yRange);
  const toX = (i: number) =>
    pL + (groups.length > 1 ? (i / (groups.length - 1)) * cW : cW / 2);

  const barW = Math.max(4, (cW / Math.max(groups.length, 1)) * 0.5);
  const dotR = Math.max(3, barW * 0.5);

  const textColor = isDark ? "rgba(255,255,255,0.62)" : "#6B7280";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  const yTickCount = 4;
  const yTicks = Array.from(
    { length: yTickCount + 1 },
    (_, i) => yMin + (i / yTickCount) * yRange,
  );
  const axisLabels = getRangeAxisLabels(range, groups.length);

  return (
    <View style={{ width: W, height: H }}>
      <Svg width={W} height={H}>
        {yTicks.map((tick, i) => {
          const y = toY(tick);
          return (
            <G key={i}>
              <Line
                x1={pL}
                y1={y}
                x2={W - pR}
                y2={y}
                stroke={gridColor}
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <SvgText
                x={pL - 4}
                y={y + 4}
                fontSize="9"
                fill={textColor}
                textAnchor="end"
              >
                {Math.round(tick)}
              </SvgText>
            </G>
          );
        })}
        {groups.map((g, i) => {
          const x = toX(i);
          const yHi = toY(g.max);
          const yLo = toY(g.min);
          const yAvg = toY(g.avg);
          const barH = Math.max(2, yLo - yHi);
          return (
            <G key={i}>
              <Rect
                x={x - barW / 2}
                y={yHi}
                width={barW}
                height={barH}
                rx={barW / 2}
                fill={accentColor}
                opacity={0.3}
              />
              <Circle cx={x} cy={yAvg} r={dotR} fill={accentColor} />
            </G>
          );
        })}
        <SvgText
          x={pL}
          y={H - 8}
          fontSize="9"
          fill={textColor}
          textAnchor="start"
        >
          {axisLabels.start}
        </SvgText>
        <SvgText
          x={W - pR}
          y={H - 8}
          fontSize="9"
          fill={textColor}
          textAnchor="end"
        >
          {axisLabels.end}
        </SvgText>
      </Svg>
    </View>
  );
}

// ─── STEPS: Bar chart + progress line overlay ────────────────────────────────
function StepsBars({
  data,
  range,
  isDark,
  semantic,
}: {
  data: number[];
  range: HistoryRange;
  isDark: boolean;
  semantic: { success: string; warning: string; danger: string };
}) {
  const W = screenWidth - 80;
  const H = 180;
  const pL = 10,
    pR = 10,
    pT = 16,
    pB = 28;
  const cW = W - pL - pR,
    cH = H - pT - pB;
  const bars = data
    .slice(0, range === "day" ? 24 : range === "week" ? 7 : 30)
    .reverse();
  const maxVal = Math.max(...bars, 1);
  const bW = (cW / bars.length) * 0.52;
  const gW = (cW / bars.length) * 0.48;
  const trackColor = isDark ? "rgba(255,255,255,0.05)" : "#EFF6FF";
  const textColor = isDark ? "rgba(255,255,255,0.56)" : "#64748B";
  const axisLabels = getRangeAxisLabels(range, bars.length);

  const pts = bars.map((v, i) => ({
    x: pL + i * (bW + gW) + bW / 2,
    y: pT + cH - (v / maxVal) * cH,
  }));
  const linePath = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${pT + cH} L ${pts[0].x} ${pT + cH} Z`;

  return (
    <View style={{ width: W, height: H, position: "relative" }}>
      <Svg width={W} height={H}>
        <Defs>
          <LinearGradient id="sbAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#7C89FF" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#7C89FF" stopOpacity="0" />
          </LinearGradient>
          <ClipPath id="sbClip">
            <Rect x={pL} y={pT} width={cW} height={cH} />
          </ClipPath>
        </Defs>
        {/* Grid */}
        {[0, 0.5, 1].map((f, i) => (
          <Line
            key={i}
            x1={pL}
            y1={pT + cH * (1 - f)}
            x2={pL + cW}
            y2={pT + cH * (1 - f)}
            stroke={trackColor}
            strokeWidth="1"
          />
        ))}
        {/* Bars */}
        {bars.map((v, i) => {
          const x = pL + i * (bW + gW);
          const bH = Math.max((v / maxVal) * cH, 2);
          const y = pT + cH - bH;
          const today = i === bars.length - 1;
          return (
            <G key={i}>
              <Rect
                x={x}
                y={pT}
                width={bW}
                height={cH}
                rx={3}
                fill={trackColor}
              />
              <Rect
                x={x}
                y={y}
                width={bW}
                height={bH}
                rx={3}
                fill={today ? "#7C89FF" : "#B8BEFF"}
                opacity={today ? 1 : 0.75}
              />
            </G>
          );
        })}
        {/* Area + Line */}
        <Path d={areaPath} fill="url(#sbAreaGrad)" clipPath="url(#sbClip)" />
        <Path
          d={linePath}
          fill="none"
          stroke="#7C89FF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          clipPath="url(#sbClip)"
        />
        {/* Axis */}
        <SvgText
          x={pL + cW}
          y={H - 6}
          fontSize="9"
          fill={textColor}
          textAnchor="end"
        >
          {axisLabels.end}
        </SvgText>
        <SvgText
          x={pL}
          y={H - 6}
          fontSize="9"
          fill={textColor}
          textAnchor="start"
        >
          {axisLabels.start}
        </SvgText>
      </Svg>

      {bars.map((v, i) => {
        const x = pL + i * (bW + gW);
        const bH = Math.max((v / maxVal) * cH, 2);
        const y = pT + cH - bH;
        const daysAgo = bars.length - 1 - i;
        const indicator = getStepsPatternIndicator(v, semantic);
        const pointTimeLabel = getRangeEntryTimeLabel(range, daysAgo);
        const entryLabel = `${pointTimeLabel}. ${Math.round(v).toLocaleString("pt-PT")} passos. Indicador ${indicator.label}.`;
        return (
          <Pressable
            key={`steps-hit-${i}`}
            style={[
              styles.chartHit,
              {
                left: x,
                top: y,
                width: Math.max(bW, 22),
                height: Math.max(bH, 28),
              },
            ]}
            accessible
            focusable
            importantForAccessibility="yes"
            accessibilityRole="text"
            accessibilityLabel={entryLabel}
            accessibilityHint="Toque duas vezes para ouvir o valor desta barra."
            onPress={() => announceEntryValue(entryLabel)}
            onAccessibilityTap={() => announceEntryValue(entryLabel)}
          />
        );
      })}

      {bars.map((v, i) => {
        const x = pL + i * (bW + gW);
        const bH = Math.max((v / maxVal) * cH, 2);
        const y = pT + cH - bH;
        const indicator = getStepsPatternIndicator(v, semantic);
        return (
          <View
            key={`steps-pattern-${i}`}
            pointerEvents="none"
            accessible={false}
            style={{
              position: "absolute",
              left: x + bW / 2 - 8,
              top: Math.max(2, y - 18),
              width: 16,
              height: 16,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isDark
                ? "rgba(15,23,42,0.82)"
                : "rgba(255,255,255,0.92)",
            }}
          >
            <Feather name={indicator.icon} size={10} color={indicator.color} />
          </View>
        );
      })}
    </View>
  );
}

// ─── TEMP: Thermometer with side tick labels ──────────────────────────────────
function Thermometer({
  value,
  isDark,
  semantic,
}: {
  value: number;
  isDark: boolean;
  semantic: { success: string; warning: string; danger: string };
}) {
  const W = 160,
    H = 230;
  const tubX = 40,
    tubW = 18;
  const bulbR = 15,
    bulbCY = H - 26;
  const tubeTop = 18,
    tubeBot = bulbCY - bulbR + 4;
  const tubeH = tubeBot - tubeTop;
  const min = 35,
    max = 40;
  const pct = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const fillH = tubeH * pct;
  const fillY = tubeBot - fillH;
  const fillColor =
    value <= 37.5
      ? semantic.success
      : value <= 38.5
        ? semantic.warning
        : semantic.danger;
  const trackColor = isDark ? "rgba(255,255,255,0.07)" : "#E5E7EB";
  const textColor = isDark ? "rgba(255,255,255,0.65)" : "#374151";
  const outlineColor = isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.09)";
  const ticks = [35, 36, 37, 37.5, 38, 38.5, 39, 40];
  return (
    <Svg width={W} height={H}>
      {/* Tube track */}
      <Rect
        x={tubX}
        y={tubeTop}
        width={tubW}
        height={tubeH}
        rx={tubW / 2}
        fill={trackColor}
      />
      {/* Fill (extends into bulb) */}
      <Rect
        x={tubX}
        y={fillY}
        width={tubW}
        height={fillH + bulbR}
        rx={tubW / 2}
        fill={fillColor}
      />
      {/* Tube outline */}
      <Rect
        x={tubX}
        y={tubeTop}
        width={tubW}
        height={tubeH}
        rx={tubW / 2}
        fill="none"
        stroke={outlineColor}
        strokeWidth="1.5"
      />
      {/* Bulb */}
      <Circle cx={tubX + tubW / 2} cy={bulbCY} r={bulbR} fill={fillColor} />
      <Circle
        cx={tubX + tubW / 2}
        cy={bulbCY}
        r={bulbR}
        fill="none"
        stroke={outlineColor}
        strokeWidth="1.5"
      />
      {/* Ticks + labels */}
      {ticks.map((t) => {
        const tp = (t - min) / (max - min);
        const tY = tubeBot - tubeH * tp;
        const major = Number.isInteger(t);
        return (
          <G key={t}>
            <Line
              x1={tubX + tubW}
              y1={tY}
              x2={tubX + tubW + (major ? 10 : 6)}
              y2={tY}
              stroke={outlineColor}
              strokeWidth="1.2"
            />
            {major && (
              <SvgText
                x={tubX + tubW + 14}
                y={tY + 4}
                fontSize="11"
                fill={textColor}
              >
                {t}°
              </SvgText>
            )}
            {t === 37.5 && (
              <SvgText
                x={tubX + tubW + 14}
                y={tY + 4}
                fontSize="9"
                fill={isDark ? semantic.warning : "#D97706"}
              >
                37.5°
              </SvgText>
            )}
          </G>
        );
      })}
      {/* Current value indicator */}
      {(() => {
        const arrowY = tubeBot - tubeH * pct;
        return (
          <>
            <Line
              x1={tubX - 2}
              y1={arrowY}
              x2={tubX - 14}
              y2={arrowY}
              stroke={fillColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <SvgText
              x={tubX - 17}
              y={arrowY + 4}
              fontSize="11"
              fontWeight="700"
              fill={fillColor}
              textAnchor="end"
            >
              {value.toFixed(1)}°
            </SvgText>
          </>
        );
      })()}
    </Svg>
  );
}

// ─── CALORIES: Radial sunburst / spoke burst ─────────────────────────────────
function CalBurst({
  value,
  goal = 2000,
  isDark,
}: {
  value: number;
  goal?: number;
  isDark: boolean;
}) {
  const size = 220,
    cx = size / 2,
    cy = size / 2;
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  const numSpokes = 36;
  const innerR = 42,
    outerR = 88;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const trackColor = isDark ? "rgba(255,255,255,0.05)" : "#E8EAFF";

  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id="cbGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#7C89FF" stopOpacity="1" />
          <Stop offset="100%" stopColor="#A5AEFF" stopOpacity="0.75" />
        </LinearGradient>
      </Defs>
      {Array.from({ length: numSpokes }, (_, i) => {
        const angle = (360 / numSpokes) * i - 90;
        const filled = i < Math.round(numSpokes * pct);
        const wobble = filled
          ? innerR +
            (outerR - innerR) *
              (0.55 + 0.45 * Math.abs(Math.sin(toRad(i * 53))))
          : innerR + (outerR - innerR) * 0.18;
        const x1 = cx + innerR * Math.cos(toRad(angle));
        const y1 = cy + innerR * Math.sin(toRad(angle));
        const x2 = cx + wobble * Math.cos(toRad(angle));
        const y2 = cy + wobble * Math.sin(toRad(angle));
        return (
          <Line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={filled ? "url(#cbGrad)" : trackColor}
            strokeWidth={filled ? 4.5 : 2.5}
            strokeLinecap="round"
          />
        );
      })}
      <Circle
        cx={cx}
        cy={cy}
        r={innerR - 3}
        fill={isDark ? "#1C2030" : "#F5F6FF"}
        stroke={isDark ? "rgba(255,255,255,0.07)" : "#E8EAFF"}
        strokeWidth="1.5"
      />
      <SvgText
        x={cx}
        y={cy - 10}
        fontSize="30"
        fontWeight="800"
        fill={isDark ? "#FFF" : "#111827"}
        textAnchor="middle"
      >
        {Math.round(value)}
      </SvgText>
      <SvgText
        x={cx}
        y={cy + 10}
        fontSize="10"
        fill={isDark ? "rgba(255,255,255,0.62)" : "#6B7280"}
        textAnchor="middle"
      >
        kcal
      </SvgText>
      <SvgText
        x={cx}
        y={cy + 26}
        fontSize="9"
        fill="#7C89FF"
        textAnchor="middle"
      >
        {Math.round(pct * 100)}% meta
      </SvgText>
    </Svg>
  );
}

// ─── STRESS/HEART: EEG-style symmetric waveform bars ────────────────────────
function StressWave({
  value,
  history,
  range,
  isDark,
  colorFn,
  indicatorFn,
}: {
  value: number;
  history: number[];
  range: HistoryRange;
  isDark: boolean;
  colorFn?: (v: number) => string;
  indicatorFn?: (v: number) => PatternIndicator;
}) {
  const W = screenWidth - 80,
    H = 150;
  const bars = history
    .slice(0, range === "day" ? 24 : range === "week" ? 7 : 30)
    .reverse();
  if (bars.length < 2) return null;
  const chartBottom = H - 16;
  const chartTop = 12;
  const chartHeight = chartBottom - chartTop;
  const bW = (W / bars.length) * 0.5;
  const gW = (W / bars.length) * 0.5;
  const stressColor = (v: number) =>
    v < 40 ? "#86EFAC" : v <= 70 ? "#FDE68A" : "#FCA5A5";
  const getColor = colorFn ?? stressColor;
  const maxVal = Math.max(...bars, 1);
  const normalize = (v: number) => v / maxVal;
  const axisLabels = getRangeAxisLabels(range, bars.length);
  return (
    <View style={{ width: W, height: H, position: "relative" }}>
      <Svg width={W} height={H}>
        {bars.map((v, i) => {
          const barH = Math.max(normalize(v) * chartHeight, 2);
          const x = i * (bW + gW);
          const y = chartBottom - barH;
          const color = getColor(v);
          return (
            <G key={i}>
              <Rect
                x={x}
                y={y}
                width={bW}
                height={barH}
                rx={bW / 2}
                fill={color}
                opacity="0.9"
              />
            </G>
          );
        })}
        <Line
          x1={0}
          y1={chartBottom}
          x2={W}
          y2={chartBottom}
          stroke={isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.08)"}
          strokeWidth="1"
          strokeDasharray="4,4"
        />
        <SvgText
          x={W - 4}
          y={14}
          fontSize="11"
          fontWeight="700"
          fill={getColor(value)}
          textAnchor="end"
        >
          {Math.round(value)}
        </SvgText>
        <SvgText
          x={0}
          y={H - 2}
          fontSize="9"
          fill={isDark ? "rgba(255,255,255,0.56)" : "#64748B"}
          textAnchor="start"
        >
          {axisLabels.start}
        </SvgText>
        <SvgText
          x={W}
          y={H - 2}
          fontSize="9"
          fill={isDark ? "rgba(255,255,255,0.56)" : "#64748B"}
          textAnchor="end"
        >
          {axisLabels.end}
        </SvgText>
      </Svg>

      {bars.map((v, i) => {
        const barH = Math.max(normalize(v) * chartHeight, 2);
        const x = i * (bW + gW);
        const y = chartBottom - barH;
        const daysAgo = bars.length - 1 - i;
        const indicator = indicatorFn?.(v);
        const pointTimeLabel = getRangeEntryTimeLabel(range, daysAgo);
        const entryLabel = `${pointTimeLabel}. Valor ${Math.round(v)}.${indicator ? ` Indicador ${indicator.label}.` : ""}`;
        return (
          <Pressable
            key={`wave-hit-${i}`}
            style={[
              styles.chartHit,
              {
                left: x,
                top: y,
                width: Math.max(bW, 18),
                height: Math.max(barH, 28),
              },
            ]}
            accessible
            focusable
            importantForAccessibility="yes"
            accessibilityRole="text"
            accessibilityLabel={entryLabel}
            accessibilityHint="Toque duas vezes para ouvir o valor desta barra."
            onPress={() => announceEntryValue(entryLabel)}
            onAccessibilityTap={() => announceEntryValue(entryLabel)}
          />
        );
      })}

      {indicatorFn &&
        bars.map((v, i) => {
          const barH = Math.max(normalize(v) * chartHeight, 2);
          const x = i * (bW + gW);
          const y = chartBottom - barH;
          const indicator = indicatorFn(v);
          return (
            <View
              key={`wave-pattern-${i}`}
              pointerEvents="none"
              accessible={false}
              style={{
                position: "absolute",
                left: x + bW / 2 - 8,
                top: Math.max(2, y - 18),
                width: 16,
                height: 16,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark
                  ? "rgba(15,23,42,0.82)"
                  : "rgba(255,255,255,0.92)",
              }}
            >
              <Feather
                name={indicator.icon}
                size={10}
                color={indicator.color}
              />
            </View>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  chartHit: {
    position: "absolute",
    backgroundColor: "transparent",
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
// Maps legacy or malformed widget IDs to the correct METRIC_CONFIGS key
const WIDGET_TYPE_ALIAS: Record<string, string> = {
  "blood Pressure": "bloodPressure",
};

export default function MasterDetail() {
  const { type, patientId } = useLocalSearchParams<{
    type: string;
    patientId?: string;
  }>();
  // Quando o ecrã é aberto a partir do cartão de um cuidado (modo aider), o
  // patientId vem nos params. Sem ele, resolve para o utilizador autenticado.
  const targetPatientId =
    patientId && patientId.length > 0 ? patientId : undefined;
  const normalizedType = WIDGET_TYPE_ALIAS[type ?? ""] ?? type;
  const resolvedType =
    normalizedType && METRIC_CONFIGS[normalizedType]
      ? normalizedType
      : DEFAULT_TYPE;
  const baseConfig = METRIC_CONFIGS[resolvedType];
  const { isDark, colors } = useTheme();
  const config: MetricConfig = {
    ...baseConfig,
    ...(resolvedType === "temp"
      ? {
          lineColor: colors.semantic.warning,
          gradientColor: colors.semantic.warning,
          accent: colors.semantic.warning,
        }
      : {}),
    ...(resolvedType === "o2"
      ? {
          lineColor: colors.semantic.success,
          gradientColor: colors.semantic.success,
          accent: colors.semantic.success,
        }
      : {}),
    ...(resolvedType === "glycemia"
      ? {
          lineColor: colors.semantic.danger,
          gradientColor: colors.semantic.danger,
          accent: colors.semantic.danger,
        }
      : {}),
  };

  const { data: metricData, isLoading } = useHealthMetric(
    config.endpoint,
    config.endpoint === "bloodPressure",
    targetPatientId,
  );
  const { data: stats } = useMetricStats(config.endpoint, targetPatientId);

  useEffect(() => {
    console.log("[DETALHE MASTER]", {
      endpoint: config.endpoint,
      targetPatientId: targetPatientId ?? null,
      isLoading,
      hasData: Boolean(metricData),
      displayValue: metricData?.displayValue ?? null,
      historyLength: metricData?.history?.length ?? 0,
      historyPreview: metricData?.history?.slice(0, 6) ?? [],
      latest: metricData?.latest ?? null,
      stats: stats ?? null,
    });
  }, [metricData, stats, isLoading, config.endpoint, targetPatientId]);

  const [selectedRange, setSelectedRange] = useState<HistoryRange>("day");
  // Série do gráfico filtrada pela janela temporal selecionada (BD, scoped ao paciente).
  const { data: rangeSeriesData } = useMetricHistory(
    config.endpoint,
    selectedRange,
    targetPatientId,
  );
  const [rangeNavWidth, setRangeNavWidth] = useState(0);
  const activeRangePillX = useRef(new Animated.Value(0)).current;
  const activeRangeIndex = RANGE_TABS.findIndex(
    (tab) => tab.key === selectedRange,
  );
  const rangeTabWidth =
    rangeNavWidth > RANGE_NAV_PADDING * 2
      ? (rangeNavWidth - RANGE_NAV_PADDING * 2) / RANGE_TABS.length
      : 0;

  const currentRaw: number = metricData?.latest?.value ?? 0;
  const history: number[] = metricData?.history ?? [];
  // Pontos {valor, timestamp} da janela selecionada (dia/semana/mês), em ordem
  // cronológica vinda da BD.
  const rangePoints = rangeSeriesData ?? [];
  const rangeHistory = rangePoints.map((p) => p.value);

  // Métricas cumulativas (passos, calorias) somam por bucket; as restantes (FC,
  // SpO2, temperatura, glicemia, pressão, stress, sono) fazem média por bucket.
  const isCumulativeMetric = ["steps", "cal", "calories"].includes(
    config.endpoint,
  );
  const bucketed = aggregateByRange(
    rangePoints,
    selectedRange,
    isCumulativeMetric ? "sum" : "avg",
  );
  // Buckets em ordem decrescente (recente → antigo) para os componentes que
  // fazem slice(0,N).reverse() (StepsBars, StressWave).
  const bucketedDesc = [...bucketed.values].reverse();

  // Para métricas de intervalo em vistas semanais/mensais: agrupar pontos raw
  // por dia de calendário para mostrar avg/min/max por dia.
  const isSleepMetric = config.endpoint === "sleep";
  const showGroupedView =
    !isCumulativeMetric && !isSleepMetric && selectedRange !== "day";
  const groupedDays: DayGroup[] = showGroupedView
    ? groupByCalendarDay(rangePoints)
    : [];

  // Para métricas de intervalo na vista diária: mostrar pontos raw sem bucketing.
  const intervalDayData =
    !isCumulativeMetric && !isSleepMetric && selectedRange === "day"
      ? rangeHistory
      : null;

  // Dados para o LineChartSlim genérico: raw para intervalo/dia, bucketed no resto.
  const genericChartData =
    intervalDayData !== null
      ? intervalDayData.length >= 2
        ? intervalDayData
        : [0, 0]
      : bucketed.values.length >= 2
        ? bucketed.values
        : [0, 0];
  const chartData = genericChartData;
  // Escala de tempo do eixo X, adequada à janela (horas/dias/datas).
  const chartLabels = thinLabels(bucketed.labels, selectedRange);
  const weeklyMeasuredDotIndexes =
    selectedRange === "week"
      ? bucketed.counts
          .map((count, index) => (count > 0 ? -1 : index))
          .filter((index) => index >= 0)
      : [];

  // Estatísticas dos buckets para os cards de resumo.
  const activeValues = bucketed.values.filter((v) => v > 0);
  const statsMin = activeValues.length ? Math.min(...activeValues) : 0;
  const statsMax = activeValues.length ? Math.max(...activeValues) : 0;
  const statsMinIdx = bucketed.values.findIndex((v) => v > 0 && v === statsMin);
  const statsMaxIdx = bucketed.values.indexOf(statsMax);
  const statsMinLabel =
    statsMinIdx >= 0 ? (bucketed.labels[statsMinIdx] ?? "") : "";
  const statsMaxLabel =
    statsMaxIdx >= 0 ? (bucketed.labels[statsMaxIdx] ?? "") : "";

  // Objetivos CUMULATIVOS escalam com a janela: dia=1, semana=7, mês=30 dias.
  // Só faz sentido para métricas aditivas (passos, calorias) — não para médias
  // (FC, SpO2, temperatura, glicemia, pressão, sono). O progresso compara o
  // TOTAL acumulado no período (soma) com o objetivo escalado.
  const rangeDays =
    selectedRange === "day" ? 1 : selectedRange === "week" ? 7 : 30;
  const periodTotal = isCumulativeMetric
    ? bucketed.values.reduce((sum, v) => sum + v, 0)
    : rangeHistory.reduce((sum, v) => sum + v, 0);
  const formatGoal = (n: number) =>
    new Intl.NumberFormat("pt-PT").format(Math.round(n));
  const stepsGoal = 10000 * rangeDays;
  const caloriesGoal = 2000 * rangeDays;
  const stepsPct = stepsGoal > 0 ? Math.min(periodTotal / stepsGoal, 1) : 0;
  const caloriesPct =
    caloriesGoal > 0 ? Math.min(periodTotal / caloriesGoal, 1) : 0;
  // Estatísticas (mín/máx/média) seguem a janela selecionada (dia/semana/mês).
  // Usa os dados do período; só recai no all-time (history/stats) se a janela
  // estiver vazia.
  const cumulativeDailyValues = isCumulativeMetric
    ? selectedRange === "day"
      ? periodTotal > 0
        ? [periodTotal]
        : []
      : activeValues
    : [];
  const statsBase = isCumulativeMetric
    ? activeValues.length
      ? activeValues
      : history
    : rangeHistory.length
      ? rangeHistory
      : history;
  const allTimeMin = statsBase.length
    ? Math.min(...statsBase)
    : (stats?.min ?? 0);
  const allTimeMax = statsBase.length
    ? Math.max(...statsBase)
    : (stats?.max ?? 0);
  const periodAvg = isCumulativeMetric
    ? cumulativeDailyValues.length
      ? calcAvg(cumulativeDailyValues)
      : 0
    : statsBase.length
      ? calcAvg(statsBase)
      : 0;
  const dayLabel = new Intl.DateTimeFormat("pt-PT", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  }).format(new Date());
  const monthLabel = new Intl.DateTimeFormat("pt-PT", {
    month: "long",
    year: "numeric",
  }).format(new Date());
  const rangeDescription =
    selectedRange === "day"
      ? `Dia: ${dayLabel}`
      : selectedRange === "week"
        ? "Última semana"
        : `Mês atual: ${monthLabel}`;

  const sleepRangeAverage =
    config.endpoint === "sleep" &&
    selectedRange !== "day" &&
    rangeHistory.length > 0 &&
    periodAvg > 0
      ? periodAvg
      : null;
  const heartRangeAverage =
    config.endpoint === "bpm" &&
    selectedRange !== "day" &&
    rangeHistory.length > 0 &&
    periodAvg > 0
      ? periodAvg
      : null;
  const o2RangeAverage =
    config.endpoint === "o2" &&
    selectedRange !== "day" &&
    rangeHistory.length > 0 &&
    periodAvg > 0
      ? periodAvg
      : null;
  const stepsRangeTotal =
    config.endpoint === "steps" && selectedRange !== "day" && periodTotal > 0
      ? periodTotal
      : null;
  const contextualCurrent =
    stepsRangeTotal ??
    sleepRangeAverage ??
    heartRangeAverage ??
    o2RangeAverage ??
    currentRaw;
  const contextualValueLabel = stepsRangeTotal
    ? "total do período"
    : sleepRangeAverage
      ? "média do período"
      : heartRangeAverage
        ? "média do período"
        : o2RangeAverage
          ? "média do período"
          : "valor atual";
  const stepGoalRatio =
    config.endpoint === "steps" && stepsGoal > 0
      ? contextualCurrent / stepsGoal
      : null;
  const status =
    stepGoalRatio === null
      ? config.getStatus(contextualCurrent)
      : stepGoalRatio < 0.7
        ? "warning"
        : "normal";
  const statusLabelText =
    stepGoalRatio === null
      ? config.statusLabel(status)
      : stepGoalRatio < 0.7
        ? "Abaixo"
        : stepGoalRatio < 1
          ? "Na Meta"
          : "Acima";
  const palette = buildStatusPalette(colors.semantic, isDark)[status];
  const extraCards = config.extraCards(
    history,
    stats ?? null,
    contextualCurrent,
  );
  const accessibleSummary = buildAccessibleSummary({
    type: resolvedType,
    config,
    current: contextualCurrent,
    statusLabel: statusLabelText,
    history,
    allTimeMin,
    allTimeMax,
  });
  const lastAnnouncedSummaryRef = useRef<string>("");

  useEffect(() => {
    if (isLoading || !accessibleSummary.accessibilityLabel) return;
    if (
      lastAnnouncedSummaryRef.current === accessibleSummary.accessibilityLabel
    )
      return;

    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      if (!enabled) return;
      AccessibilityInfo.announceForAccessibility(
        accessibleSummary.accessibilityLabel,
      );
      lastAnnouncedSummaryRef.current = accessibleSummary.accessibilityLabel;
    });
  }, [isLoading, accessibleSummary.accessibilityLabel]);

  useEffect(() => {
    console.log("[DETALHE MASTER RANGE]", {
      endpoint: config.endpoint,
      selectedRange,
      targetPatientId: targetPatientId ?? null,
      points: rangeSeriesData?.length ?? 0,
      preview: rangeSeriesData?.slice(0, 6).map((p) => p.value) ?? [],
    });
  }, [config.endpoint, selectedRange, targetPatientId, rangeSeriesData]);

  useEffect(() => {
    if (rangeTabWidth <= 0 || activeRangeIndex < 0) return;
    Animated.timing(activeRangePillX, {
      toValue: activeRangeIndex * rangeTabWidth,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [activeRangeIndex, activeRangePillX, rangeTabWidth]);

  const cardBg = isDark
    ? "bg-aide-dark-card border-white/10"
    : "bg-white border-gray-100";
  const shadow = { boxShadow: "0 2px 12px 0 rgba(0,0,0,0.08)" } as any;
  const tp = isDark ? "text-white" : "text-black";
  const ts = isDark ? "text-gray-300" : "text-gray-600";
  const tu = isDark ? "text-gray-300" : "text-black";
  const tAccent = config.accent;
  const heroTitle =
    resolvedType === "heart" ? "Batimentos Cardíacos" : config.label;
  const heroValue = config.formatValue(contextualCurrent);
  const heroDigits = `${Math.abs(Math.trunc(contextualCurrent))}`.length;
  const heroFontSize =
    resolvedType === "steps"
      ? heroDigits >= 6
        ? 54
        : heroDigits >= 5
          ? 60
          : 68
      : 68;
  const heroLineHeight =
    resolvedType === "steps"
      ? heroDigits >= 6
        ? 58
        : heroDigits >= 5
          ? 64
          : 72
      : 72;
  const standardizedScale = getStandardizedMetricScale(
    resolvedType,
    colors.semantic,
    resolvedType === "steps" ? rangeDays : 1,
  );
  const clampedCurrent = Math.min(
    Math.max(contextualCurrent, standardizedScale.min),
    standardizedScale.max,
  );
  const activeBand =
    standardizedScale.bands.find((band, index) => {
      const isLast = index === standardizedScale.bands.length - 1;
      return isLast
        ? clampedCurrent >= band.min && clampedCurrent <= band.max
        : clampedCurrent >= band.min && clampedCurrent < band.max;
    }) ?? standardizedScale.bands[0];
  const formatScaleNumber = (value: number) => {
    if (resolvedType === "steps" || resolvedType === "glycemia") {
      return Math.round(value).toLocaleString("pt-PT");
    }
    return Number.isInteger(value) ? `${value}` : `${value}`;
  };
  const getBandRangeText = (band: MetricBand, index: number) => {
    const unitText = config.displayUnit ? ` ${config.displayUnit}` : "";
    const minText = formatScaleNumber(band.min);
    const maxText = formatScaleNumber(band.max);
    const isLast = index === standardizedScale.bands.length - 1;
    return isLast
      ? `≥ ${minText}${unitText}`
      : `${minText} – ${maxText}${unitText}`;
  };
  const formatNarratorNumber = (value: number) => {
    const abs = Math.abs(value);
    if (Number.isInteger(value)) {
      if (abs >= 1000) {
        const thousands = Math.floor(abs / 1000);
        const rest = abs % 1000;
        const base =
          rest === 0 ? `${thousands} mil` : `${thousands} mil ${rest}`;
        return value < 0 ? `menos ${base}` : base;
      }
      return `${value}`;
    }
    const fixed = value.toFixed(1).replace(".", " virgula ");
    return value < 0 ? `menos ${fixed.replace("-", "")}` : fixed;
  };
  const spokenUnit =
    config.displayUnit === "%" ? "por cento" : config.displayUnit;
  const spokenCurrent = `${formatNarratorNumber(contextualCurrent)}${spokenUnit ? ` ${spokenUnit}` : ""}`;
  const spokenDailyAverage = `${formatNarratorNumber(Math.round(periodAvg))} passos`;
  const spokenMax = `${formatNarratorNumber(allTimeMax)}${spokenUnit ? ` ${spokenUnit}` : ""}`;
  const spokenMin = `${formatNarratorNumber(allTimeMin)}${spokenUnit ? ` ${spokenUnit}` : ""}`;
  const heroAccessibilityLabel =
    resolvedType === "steps"
      ? `${heroTitle}. ${contextualValueLabel} ${spokenCurrent}. Estado ${statusLabelText}. Media diaria ${spokenDailyAverage}. Meta ${formatGoal(stepsGoal)} passos.`
      : `${heroTitle}. ${contextualValueLabel} ${spokenCurrent}. Estado ${statusLabelText}. Maximo ${spokenMax}. Minimo ${spokenMin}.`;
  const chartLatest = chartData.length
    ? chartData[chartData.length - 1]
    : currentRaw;
  const spokenChartLatest = `${formatNarratorNumber(chartLatest)}${spokenUnit ? ` ${spokenUnit}` : ""}`;
  const heartPatternValues = rangeHistory.length
    ? rangeHistory
    : history.length
      ? history
      : chartData;
  const heartAvg = heartPatternValues.length
    ? calcAvg(heartPatternValues)
    : null;
  const heartHighs = heartPatternValues.filter((v) => v > 100);
  const heartLows = heartPatternValues.filter((v) => v < 60);
  const heartAvgHigh = heartHighs.length ? calcAvg(heartHighs) : null;
  const heartAvgLow = heartLows.length ? calcAvg(heartLows) : null;

  const TEMP_ZONES: {
    label: string;
    range: [number, number];
    color: string;
    display: string;
  }[] = [
    {
      label: "Hipotermia",
      range: [0, 36],
      color: "#93C5FD",
      display: "< 36 ºC",
    },
    {
      label: "Normal",
      range: [36, 37.5],
      color: colors.semantic.success,
      display: "36 – 37.5 ºC",
    },
    {
      label: "Febre Baixa",
      range: [37.5, 38.5],
      color: colors.semantic.warning,
      display: "37.5 – 38.5 ºC",
    },
    {
      label: "Febre Alta",
      range: [38.5, 999],
      color: colors.semantic.danger,
      display: "≥ 38.5 ºC",
    },
  ];
  const O2_LEGEND = [
    { label: "Normal", desc: "≥ 96%", color: colors.semantic.success },
    { label: "Baixo", desc: "94–95%", color: colors.semantic.warning },
    { label: "Crítico", desc: "< 94%", color: colors.semantic.danger },
  ];
  const getBandRangeSpeech = (band: MetricBand, index: number) => {
    const unitText = spokenUnit ? ` ${spokenUnit}` : "";
    const minText = formatNarratorNumber(band.min);
    const maxText = formatNarratorNumber(band.max);
    const isLast = index === standardizedScale.bands.length - 1;
    return isLast
      ? `a partir de ${minText}${unitText}`
      : `de ${minText} ate ${maxText}${unitText}`;
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LightBackground>
        <View className="flex-1 px-4 pt-10">
          <SafeAreaView className="flex-1">
            <View className="mb-4">
              <BackButton label={config.label} dark={isDark} />
            </View>

            {isLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator
                  size="large"
                  color={config.accent}
                  accessibilityLabel={`A carregar ${config.label}`}
                />
              </View>
            ) : (
              <>
                <View className="w-full mb-5">
                  <View
                    onLayout={(event) =>
                      setRangeNavWidth(event.nativeEvent.layout.width)
                    }
                    className={`flex-row rounded-full p-1 ${
                      isDark ? "bg-white/10" : "bg-slate-100"
                    }`}
                    style={{
                      borderWidth: 1,
                      borderColor: isDark
                        ? "rgba(255,255,255,0.12)"
                        : "rgba(15,23,42,0.08)",
                      shadowColor: isDark ? "#000000" : "#0F172A",
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: isDark ? 0.4 : 0.12,
                      shadowRadius: 12,
                      elevation: 6,
                    }}
                  >
                    {rangeTabWidth > 0 ? (
                      <Animated.View
                        pointerEvents="none"
                        style={{
                          position: "absolute",
                          top: RANGE_NAV_PADDING,
                          bottom: RANGE_NAV_PADDING,
                          left: RANGE_NAV_PADDING,
                          width: rangeTabWidth,
                          borderRadius: 999,
                          backgroundColor: config.accent,
                          transform: [{ translateX: activeRangePillX }],
                        }}
                      />
                    ) : null}
                    {RANGE_TABS.map((tab) => {
                      const isActive = selectedRange === tab.key;
                      return (
                        <Pressable
                          key={tab.key}
                          className="flex-1 rounded-full px-3 py-2 items-center"
                          accessibilityRole="button"
                          accessibilityState={{ selected: isActive }}
                          accessibilityLabel={`Selecionar ${tab.label.toLowerCase()}`}
                          onPress={() => setSelectedRange(tab.key)}
                        >
                          <Text
                            className="text-xs font-open-sans"
                            style={{
                              color: isActive
                                ? "#FFFFFF"
                                : isDark
                                  ? "rgba(255,255,255,0.72)"
                                  : "#334155",
                              fontWeight: isActive ? "700" : "500",
                            }}
                          >
                            {tab.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text className={`text-xs font-open-sans mt-2 ${ts}`}>
                    {rangeDescription}
                  </Text>
                </View>

                <ScrollView
                  className="flex-1"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 48 }}
                >
                  <View
                    accessible
                    collapsable={false}
                    importantForAccessibility="yes"
                    accessibilityLabel={accessibleSummary.accessibilityLabel}
                    style={{
                      position: "absolute",
                      width: 1,
                      height: 1,
                      opacity: 0,
                    }}
                  />

                  {/* ── Hero Value Card ────────────────────────────────────── */}
                  <View
                    className={`rounded-3xl p-6 border mb-5 ${cardBg}`}
                    style={shadow}
                    accessible
                    focusable
                    importantForAccessibility="yes"
                    accessibilityRole="text"
                    accessibilityLabel={heroAccessibilityLabel}
                  >
                    <View className="flex-row items-start justify-between gap-4">
                      <View className="flex-1" style={{ minWidth: 0 }}>
                        <Text
                          className="text-base font-safiro"
                          style={{ color: config.accent }}
                        >
                          {heroTitle}
                        </Text>
                        <View
                          className="mb-3"
                          accessible
                          accessibilityRole="text"
                          accessibilityLabel={spokenCurrent}
                          focusable
                          importantForAccessibility="yes"
                        >
                          <Text
                            style={{
                              color: isDark ? "#FFFFFF" : "#111827",
                              fontSize: heroFontSize,
                              lineHeight: heroLineHeight,
                              fontWeight: "800",
                              letterSpacing: -2,
                            }}
                            className="font-open-sans"
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}
                            accessible={false}
                          >
                            {heroValue}
                          </Text>
                          <Text
                            className={`text-base font-medium ${tu}`}
                            accessible={false}
                          >
                            {config.displayUnit}
                          </Text>
                        </View>
                        <View
                          className="self-start flex-row items-center gap-1.5 px-4 py-1.5 rounded-full"
                          style={{
                            backgroundColor: palette.bg,
                            borderWidth: 1,
                            borderColor: palette.border,
                          }}
                        >
                          <Feather
                            name={
                              status === "normal"
                                ? "check-circle"
                                : status === "warning"
                                  ? "alert-circle"
                                  : "alert-triangle"
                            }
                            size={13}
                            color={palette.text}
                            accessible={false}
                          />
                          <Text
                            className="text-xs font-bold font-open-sans"
                            style={{ color: palette.text }}
                          >
                            {statusLabelText}
                          </Text>
                        </View>
                      </View>
                      <View
                        className="items-end gap-3 flex-shrink-0"
                        style={{ width: 120 }}
                      >
                        {resolvedType === "steps" ? (
                          <>
                            <View
                              className="items-end"
                              accessible
                              accessibilityRole="text"
                              accessibilityLabel={`Media diaria ${spokenDailyAverage}.`}
                            >
                              <View className="flex-row items-baseline">
                                <Text
                                  className={`text-2xl font-bold font-open-sans ${tp}`}
                                  accessible={false}
                                >
                                  {Math.round(periodAvg).toLocaleString(
                                    "pt-PT",
                                  )}
                                </Text>
                                <Text
                                  className={`text-xs ml-1 ${tu}`}
                                  accessible={false}
                                >
                                  passos
                                </Text>
                              </View>
                              <Text
                                className="text-xs font-open-sans mt-0.5"
                                style={{ color: tAccent }}
                                accessible={false}
                              >
                                Média Diária
                              </Text>
                            </View>
                            <View
                              className={`w-10 h-[2px] ${isDark ? "bg-white/15" : "bg-gray-300"}`}
                            />
                            <View
                              className="items-end"
                              accessible
                              accessibilityRole="text"
                              accessibilityLabel={`Meta ${formatGoal(stepsGoal)} passos.`}
                            >
                              <View className="flex-row items-baseline">
                                <Text
                                  className={`text-2xl font-bold font-open-sans ${tp}`}
                                  accessible={false}
                                >
                                  {formatGoal(stepsGoal)}
                                </Text>
                                <Text
                                  className={`text-xs ml-1 ${tu}`}
                                  accessible={false}
                                >
                                  passos
                                </Text>
                              </View>
                              <Text
                                className="text-xs font-open-sans mt-0.5"
                                style={{ color: tAccent }}
                                accessible={false}
                              >
                                Meta
                              </Text>
                            </View>
                          </>
                        ) : (
                          <>
                            <View
                              className="items-end"
                              accessible
                              accessibilityRole="text"
                              accessibilityLabel={`Maximo ${spokenMax}.`}
                            >
                              <View className="flex-row items-baseline">
                                <Text
                                  className={`text-2xl font-bold font-open-sans ${tp}`}
                                  accessible={false}
                                >
                                  {allTimeMax}
                                </Text>
                                <Text
                                  className={`text-xs ml-1 ${tu}`}
                                  accessible={false}
                                >
                                  {config.displayUnit}
                                </Text>
                              </View>
                              <Text
                                className="text-xs font-open-sans mt-0.5"
                                style={{ color: tAccent }}
                                accessible={false}
                              >
                                Máximo
                              </Text>
                            </View>
                            <View
                              className={`w-10 h-[2px] ${isDark ? "bg-white/15" : "bg-gray-300"}`}
                            />
                            <View
                              className="items-end"
                              accessible
                              accessibilityRole="text"
                              accessibilityLabel={`Minimo ${spokenMin}.`}
                            >
                              <View className="flex-row items-baseline">
                                <Text
                                  className={`text-2xl font-bold font-open-sans ${tp}`}
                                  accessible={false}
                                >
                                  {allTimeMin}
                                </Text>
                                <Text
                                  className={`text-xs ml-1 ${tu}`}
                                  accessible={false}
                                >
                                  {config.displayUnit}
                                </Text>
                              </View>
                              <Text
                                className="text-xs font-open-sans mt-0.5"
                                style={{ color: tAccent }}
                                accessible={false}
                              >
                                Mínimo
                              </Text>
                            </View>
                          </>
                        )}
                      </View>
                    </View>
                  </View>

                  {/*
                <View
                  className={`rounded-3xl p-5 border mb-5 ${cardBg}`}
                  style={shadow}
                  accessible
                  accessibilityLabel={accessibleSummary.accessibilityLabel}
                >
                  <Text className="text-base font-safiro mb-2" style={{ color: config.accent }}>
                    {accessibleSummary.title}
                  </Text>
                  {accessibleSummary.lines.map((line) => (
                    <Text key={line} className={`text-sm font-open-sans mb-1.5 ${tp}`}>
                      {line}
                    </Text>
                  ))}
                </View>
                */}

                  {/* ════ UNIQUE VISUALIZATIONS PER METRIC ════ */}

                  {/* ── HEART: EEG waveform ───────────────────────────────── */}
                  {resolvedType === "heart" && (
                    <View
                      className={`rounded-3xl p-5 border mb-5 ${cardBg}`}
                      style={shadow}
                    >
                      <View className="flex-row items-center justify-between mb-4">
                        <Text
                          className="text-base font-safiro"
                          style={{ color: config.accent }}
                        >
                          Perfil Cardíaco
                        </Text>
                        <View className="flex-row gap-4">
                          {[
                            { color: colors.semantic.success, label: "Normal" },
                            {
                              color: colors.semantic.warning,
                              label: "Elevado",
                            },
                            { color: colors.semantic.danger, label: "Crítico" },
                          ].map((r) => (
                            <View
                              key={r.label}
                              className="items-center gap-0.5"
                              accessible
                              accessibilityRole="text"
                              accessibilityLabel={`Legenda cardíaca: ${r.label}.`}
                            >
                              <View
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: r.color }}
                                accessible={false}
                              />
                              <Text
                                className="text-xs font-open-sans"
                                style={{
                                  color: isDark
                                    ? "rgba(255,255,255,0.62)"
                                    : "#6B7280",
                                }}
                                accessible={false}
                              >
                                {r.label}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                      <View
                        className="items-center"
                        accessible={false}
                        importantForAccessibility="no"
                      >
                        <StressWave
                          value={contextualCurrent}
                          history={bucketedDesc}
                          range={selectedRange}
                          isDark={isDark}
                          indicatorFn={(v) =>
                            getHeartPatternIndicator(v, colors.semantic)
                          }
                          colorFn={(v) =>
                            v <= 60
                              ? "#93C5FD"
                              : v <= 100
                                ? colors.semantic.success
                                : v <= 140
                                  ? colors.semantic.warning
                                  : colors.semantic.danger
                          }
                        />
                      </View>
                      <View className="flex-row h-2 rounded-full overflow-hidden mt-4">
                        <View
                          style={{ flex: 20, backgroundColor: "#93C5FD" }}
                        />
                        <View
                          style={{
                            flex: 40,
                            backgroundColor: colors.semantic.success,
                          }}
                        />
                        <View
                          style={{
                            flex: 30,
                            backgroundColor: colors.semantic.warning,
                          }}
                        />
                        <View
                          style={{
                            flex: 10,
                            backgroundColor: colors.semantic.danger,
                          }}
                        />
                      </View>
                      <View className="flex-row justify-between mt-1">
                        {["40", "60", "100", "140+"].map((v) => (
                          <Text
                            key={v}
                            className={`text-xs font-open-sans ${ts}`}
                          >
                            {v}
                          </Text>
                        ))}
                      </View>
                      <View
                        className="rounded-2xl p-3 mt-3"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.04)"
                            : "#F6F7FF",
                        }}
                        accessible
                        accessibilityRole="text"
                        accessibilityLabel="Indicadores do grafico cardiaco: seta para baixo indica batimento baixo, traco indica normal, seta para cima indica elevado ou critico."
                      >
                        <Text className={`text-xs font-open-sans mb-2 ${ts}`}>
                          Indicadores por barra
                        </Text>
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center gap-1.5">
                            <Feather
                              name="chevron-down"
                              size={12}
                              color="#93C5FD"
                            />
                            <Text className={`text-xs font-open-sans ${ts}`}>
                              Baixo
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-1.5">
                            <Feather
                              name="minus"
                              size={12}
                              color={colors.semantic.success}
                            />
                            <Text className={`text-xs font-open-sans ${ts}`}>
                              Normal
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-1.5">
                            <Feather
                              name="chevron-up"
                              size={12}
                              color={colors.semantic.warning}
                            />
                            <Text className={`text-xs font-open-sans ${ts}`}>
                              Elevado
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* ── O2: Range column chart ──────────────────────────── */}
                  {resolvedType === "o2" && (
                    <View
                      className={`rounded-3xl p-5 border mb-5 ${cardBg}`}
                      style={shadow}
                    >
                      <View className="flex-row items-center justify-between mb-1">
                        <Text
                          className="text-base font-safiro"
                          style={{ color: config.accent }}
                        >
                          {selectedRange === "day"
                            ? "Saturação Atual"
                            : "Saturação Média"}
                        </Text>
                        <Text className={`text-xs font-open-sans ${ts}`}>
                          {rangeDescription}
                        </Text>
                      </View>
                      <View className="mb-3">
                        <View className="flex-row items-baseline gap-1">
                          <Text
                            style={{
                              color: isDark ? "#FFF" : "#111827",
                              fontSize: 28,
                              fontWeight: "800",
                            }}
                            className="font-open-sans"
                          >
                            {config.formatValue(contextualCurrent)}
                          </Text>
                          <Text className={`text-sm font-open-sans ${tu}`}>
                            %
                          </Text>
                          <Text className={`text-xs font-open-sans ml-1 ${ts}`}>
                            {contextualValueLabel}
                          </Text>
                        </View>
                        {rangeHistory.length > 0 ? (
                          <Text className={`text-xs font-open-sans ${ts}`}>
                            Intervalo observado:{" "}
                            {config.formatValue(allTimeMin)}–
                            {config.formatValue(allTimeMax)}%
                          </Text>
                        ) : null}
                      </View>
                      <View
                        className="items-center"
                        accessible={false}
                        importantForAccessibility="no"
                      >
                        <O2RangeColumns
                          values={bucketed.values}
                          mins={bucketed.mins}
                          maxs={bucketed.maxs}
                          counts={bucketed.counts}
                          range={selectedRange}
                          isDark={isDark}
                          semantic={colors.semantic}
                        />
                      </View>
                      <View className="flex-row justify-center gap-8 mt-4">
                        {O2_LEGEND.map((r) => (
                          <View
                            key={r.label}
                            className="items-center gap-1"
                            accessible
                            accessibilityRole="text"
                            accessibilityLabel={`${r.label}. ${r.desc}.`}
                          >
                            <View
                              className="w-8 h-3 rounded-full"
                              style={{ backgroundColor: r.color }}
                              accessible={false}
                            />
                            <Text
                              className="text-xs font-open-sans"
                              style={{ color: tAccent }}
                              accessible={false}
                            >
                              {r.label}
                            </Text>
                            <Text
                              className={`text-xs font-open-sans ${ts}`}
                              accessible={false}
                            >
                              {r.desc}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* ── STEPS: Bar + line chart ───────────────────────────── */}
                  {resolvedType === "steps" && (
                    <View
                      className={`rounded-3xl p-5 border mb-5 ${cardBg}`}
                      style={shadow}
                    >
                      <View className="flex-row items-center justify-between mb-4">
                        <Text
                          className="text-base font-safiro"
                          style={{ color: config.accent }}
                        >
                          Passos Diários
                        </Text>
                        <Text className={`text-xs font-open-sans ${ts}`}>
                          {rangeDescription}
                        </Text>
                      </View>
                      <View
                        className="items-center"
                        accessible={false}
                        importantForAccessibility="no"
                      >
                        <StepsBars
                          data={bucketedDesc}
                          range={selectedRange}
                          isDark={isDark}
                          semantic={colors.semantic}
                        />
                      </View>
                      <View className="mt-4">
                        <View className="flex-row justify-between mb-1">
                          <Text
                            className="text-xs font-open-sans"
                            style={{ color: tAccent }}
                          >
                            Progresso para a meta
                          </Text>
                          <Text
                            className="text-xs font-bold font-open-sans"
                            style={{ color: config.accent }}
                          >
                            {Math.round(stepsPct * 100)}%
                          </Text>
                        </View>
                        <View
                          className={`h-3 rounded-full overflow-hidden ${isDark ? "bg-white/15" : "bg-blue-100"}`}
                        >
                          <View
                            className="h-3 rounded-full"
                            style={{
                              width: `${stepsPct * 100}%`,
                              backgroundColor: config.accent,
                            }}
                          />
                        </View>
                        <View className="flex-row justify-between mt-1">
                          <Text className={`text-xs font-open-sans ${ts}`}>
                            0
                          </Text>
                          <Text className={`text-xs font-open-sans ${ts}`}>
                            {formatGoal(stepsGoal)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* ── TEMP: Thermometer ─────────────────────────────────── */}
                  {resolvedType === "temp" && (
                    <View
                      className={`rounded-3xl p-5 border mb-5 ${cardBg}`}
                      style={shadow}
                    >
                      <Text
                        className="text-base font-safiro mb-4"
                        style={{ color: config.accent }}
                      >
                        Temperatura Atual
                      </Text>
                      <View className="flex-row items-center">
                        <View
                          className="items-center justify-center"
                          accessible
                          focusable
                          importantForAccessibility="yes"
                          accessibilityRole="image"
                          accessibilityLabel={`Grafico de temperatura corporal. Valor atual ${spokenCurrent}.`}
                        >
                          <Thermometer
                            value={currentRaw}
                            isDark={isDark}
                            semantic={colors.semantic}
                          />
                        </View>
                        <View className="flex-1 gap-3 pl-2">
                          <Text
                            className="text-xs font-open-sans"
                            style={{ color: tAccent }}
                          >
                            Referência
                          </Text>
                          {TEMP_ZONES.map((z) => {
                            const active =
                              currentRaw >= z.range[0] &&
                              currentRaw < z.range[1];
                            return (
                              <View
                                key={z.label}
                                className="flex-row items-center gap-2 py-1.5 px-2.5 rounded-xl"
                                accessible
                                accessibilityRole="text"
                                accessibilityLabel={`${z.label}. Intervalo ${z.display}.${active ? " Zona atual." : ""}`}
                                style={
                                  active
                                    ? {
                                        backgroundColor: `${z.color}28`,
                                        borderWidth: 1,
                                        borderColor: z.color,
                                      }
                                    : undefined
                                }
                              >
                                <View
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: z.color }}
                                  accessible={false}
                                />
                                <View>
                                  <Text
                                    className="text-xs font-open-sans"
                                    style={{
                                      color: tAccent,
                                      fontWeight: active ? "700" : "400",
                                    }}
                                    accessible={false}
                                  >
                                    {z.label}
                                  </Text>
                                  <Text
                                    className={`text-xs font-open-sans ${ts}`}
                                    accessible={false}
                                  >
                                    {z.display}
                                  </Text>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  )}

                  {/* ── CALORIES: Sunburst ────────────────────────────────── */}
                  {resolvedType === "glycemia" && (
                    <View
                      className={`rounded-3xl p-5 border mb-5 ${cardBg}`}
                      style={shadow}
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <Text
                          className="text-base font-safiro"
                          style={{ color: config.accent }}
                        >
                          Calorias Queimadas
                        </Text>
                        <Text className={`text-xs font-open-sans ${ts}`}>
                          Meta: {formatGoal(caloriesGoal)} kcal
                        </Text>
                      </View>
                      <View
                        className="items-center"
                        accessible
                        focusable
                        importantForAccessibility="yes"
                        accessibilityRole="image"
                        accessibilityLabel={`Grafico de calorias queimadas. Total no periodo ${formatGoal(periodTotal)}. Meta ${formatGoal(caloriesGoal)} kcal.`}
                      >
                        <CalBurst
                          value={periodTotal}
                          goal={caloriesGoal}
                          isDark={isDark}
                        />
                      </View>
                      <View
                        className={`h-2 rounded-full mt-2 ${isDark ? "bg-white/15" : "bg-orange-100"}`}
                      >
                        <View
                          className="h-2 rounded-full"
                          style={{
                            width: `${caloriesPct * 100}%`,
                            backgroundColor: config.accent,
                          }}
                        />
                      </View>
                      <View className="flex-row justify-between mt-1">
                        <Text className={`text-xs font-open-sans ${ts}`}>
                          0 kcal
                        </Text>
                        <Text className={`text-xs font-open-sans ${ts}`}>
                          {formatGoal(caloriesGoal)} kcal
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* ── STRESS: 3-Ring Concentric Circles ────────────────── */}
                  {resolvedType === "stress" && (
                    <View
                      className={`rounded-3xl p-5 border mb-5 ${cardBg}`}
                      style={shadow}
                    >
                      <View className="flex-row items-center justify-between mb-1">
                        <Text
                          className="text-base font-safiro"
                          style={{ color: config.accent }}
                        >
                          Zonas de Stress
                        </Text>
                        <View className="flex-row gap-3">
                          {[
                            { color: colors.semantic.success, label: "Baixo" },
                            {
                              color: colors.semantic.warning,
                              label: "Moderado",
                            },
                            { color: colors.semantic.danger, label: "Alto" },
                          ].map((z) => (
                            <View
                              key={z.label}
                              className="flex-row items-center gap-1"
                              accessible
                              accessibilityRole="text"
                              accessibilityLabel={`Nivel de stress ${z.label}.`}
                            >
                              <View
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: z.color }}
                                accessible={false}
                              />
                              <Text
                                className="text-xs font-open-sans"
                                style={{
                                  color: isDark
                                    ? "rgba(255,255,255,0.62)"
                                    : "#6B7280",
                                }}
                                accessible={false}
                              >
                                {z.label}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                      <View
                        className="items-center py-2"
                        accessible
                        focusable
                        importantForAccessibility="yes"
                        accessibilityRole="image"
                        accessibilityLabel={`Grafico de zonas de stress. Valor atual ${spokenCurrent}.`}
                      >
                        <HeartTripleRings
                          value={currentRaw}
                          isDark={isDark}
                          centerLabel="stress"
                          semantic={colors.semantic}
                        />
                      </View>
                      <View
                        className="rounded-2xl p-3 mt-1"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.04)"
                            : config.accentLight,
                        }}
                      >
                        <Text
                          className="text-xs font-open-sans text-center"
                          style={{
                            color: isDark
                              ? "rgba(255,255,255,0.62)"
                              : "#4B5563",
                          }}
                        >
                          Cada anel representa uma zona de stress. O ponto
                          luminoso indica a progressão na zona atual.
                        </Text>
                      </View>
                    </View>
                  )}

                  <View
                    className={`rounded-3xl p-5 border mb-5 ${cardBg}`}
                    style={shadow}
                    accessible
                    focusable
                    importantForAccessibility="yes"
                    accessibilityRole="text"
                    accessibilityLabel={`Posicao atual da metrica. Valor atual ${spokenCurrent}. Zona atual ${activeBand.label}.`}
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <Text
                        className="text-base font-safiro"
                        style={{ color: tAccent }}
                      >
                        Posição Atual da Métrica
                      </Text>
                      <View className="flex-row items-center gap-2 px-2 py-1 rounded-full">
                        <View
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: activeBand.color }}
                        />
                        <Text
                          className="text-xs font-open-sans"
                          style={{ color: activeBand.color }}
                        >
                          {activeBand.label}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-baseline gap-1 mb-4">
                      <Text className={`text-2xl font-bold font-safiro ${tp}`}>
                        {config.formatValue(contextualCurrent)}
                      </Text>
                      <Text className={`text-sm font-open-sans ${tu}`}>
                        {config.displayUnit}
                      </Text>
                      <Text className={`text-xs font-open-sans ml-1 ${ts}`}>
                        {contextualValueLabel}
                      </Text>
                    </View>

                    <View className="gap-2">
                      {standardizedScale.bands.map((band, index) => {
                        const isBandActive = band.label === activeBand.label;
                        return (
                          <View
                            key={band.label}
                            className="rounded-2xl px-3 py-3 border flex-row items-center justify-between"
                            accessible
                            accessibilityRole="text"
                            accessibilityLabel={`${band.label}. Intervalo ${getBandRangeSpeech(band, index)}.${isBandActive ? " Zona ativa." : ""}`}
                            style={
                              isBandActive
                                ? {
                                    borderColor: band.color,
                                    backgroundColor: "transparent",
                                  }
                                : {
                                    borderColor: isDark
                                      ? "rgba(255,255,255,0.08)"
                                      : "rgba(15,23,42,0.08)",
                                    backgroundColor: "transparent",
                                  }
                            }
                          >
                            <View className="flex-row items-center gap-2.5">
                              <View
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: band.color }}
                                accessible={false}
                              />
                              <Text
                                className="text-base font-open-sans"
                                style={{
                                  color: band.color,
                                  fontWeight: isBandActive ? "700" : "500",
                                }}
                                accessible={false}
                              >
                                {band.label}
                              </Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                              <Text
                                className={`text-sm font-open-sans ${ts}`}
                                accessible={false}
                              >
                                {getBandRangeText(band, index)}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {/* ── History Line Chart ────────────────────────────────── */}
                  {resolvedType === "heart" ? (
                    // Heart: Show average visualization
                    <View
                      className={`rounded-3xl p-5 border mb-5 ${cardBg}`}
                      style={shadow}
                      accessible
                      focusable
                      importantForAccessibility="yes"
                      accessibilityRole="image"
                      accessibilityLabel={`Grafico de medias cardiacas. Media ${heartAvg !== null ? `${formatNarratorNumber(Math.round(heartAvg))} bpm` : "indisponivel"}. Media alta ${heartAvgHigh !== null ? `${formatNarratorNumber(Math.round(heartAvgHigh))} bpm` : "indisponivel"}. Media baixa ${heartAvgLow !== null ? `${formatNarratorNumber(Math.round(heartAvgLow))} bpm` : "indisponivel"}.`}
                    >
                      <View className="flex-row justify-between items-center mb-4">
                        <Text
                          className="text-base font-safiro"
                          style={{ color: tAccent }}
                        >
                          Médias
                        </Text>
                        <Text className={`text-xs font-open-sans ${ts}`}>
                          {rangeDescription}
                        </Text>
                      </View>
                      {/* Average Visualization */}
                      {(() => {
                        const h = heartPatternValues;
                        if (!h.length) {
                          return (
                            <View className="items-center justify-center py-8">
                              <Text className={`text-sm ${ts}`}>
                                Aguardando dados...
                              </Text>
                            </View>
                          );
                        }
                        const avg = calcAvg(h);
                        const highs = h.filter((v) => v > 100);
                        const lows = h.filter((v) => v < 60);
                        const avgHigh = highs.length ? calcAvg(highs) : null;
                        const avgLow = lows.length ? calcAvg(lows) : null;

                        return (
                          <View className="flex-row items-center justify-between">
                            {/* Main Average Circle */}
                            <View className="items-center">
                              <View
                                className="w-24 h-24 rounded-full items-center justify-center border-4"
                                style={{
                                  borderColor: config.accent,
                                  backgroundColor: isDark
                                    ? "rgba(124,137,255,0.1)"
                                    : "#EEF0FF",
                                }}
                              >
                                <Text
                                  className="text-3xl font-bold font-safiro"
                                  style={{ color: config.accent }}
                                >
                                  {Math.round(avg)}
                                </Text>
                                <Text className={`text-xs ${ts}`}>Média</Text>
                              </View>
                            </View>

                            {/* High and Low Averages */}
                            <View className="flex-1 ml-4 gap-3">
                              {/* High */}
                              <View
                                className="rounded-xl p-3 flex-row items-center justify-between"
                                style={{
                                  backgroundColor: isDark
                                    ? "rgba(252,165,165,0.1)"
                                    : "#FEF2F2",
                                }}
                                accessible
                                accessibilityRole="text"
                                accessibilityLabel={`Media alta. ${avgHigh !== null ? `${formatNarratorNumber(Math.round(avgHigh))} bpm` : "indisponivel"}.`}
                              >
                                <View className="flex-row items-center gap-2">
                                  <View
                                    className="w-8 h-8 rounded-full items-center justify-center"
                                    style={{
                                      backgroundColor: colors.semantic.danger,
                                    }}
                                  >
                                    <Feather
                                      name="trending-up"
                                      size={16}
                                      color="#991B1B"
                                      accessible={false}
                                    />
                                  </View>
                                  <Text
                                    className={`text-sm font-open-sans ${ts}`}
                                    accessible={false}
                                  >
                                    Média Alta
                                  </Text>
                                </View>
                                <Text
                                  className="text-lg font-bold font-safiro"
                                  style={{ color: colors.semantic.danger }}
                                  accessible={false}
                                >
                                  {avgHigh !== null
                                    ? Math.round(avgHigh)
                                    : "--"}
                                </Text>
                              </View>

                              {/* Low */}
                              <View
                                className="rounded-xl p-3 flex-row items-center justify-between"
                                style={{
                                  backgroundColor: isDark
                                    ? "rgba(134,239,172,0.1)"
                                    : "#F0FDF4",
                                }}
                                accessible
                                accessibilityRole="text"
                                accessibilityLabel={`Media baixa. ${avgLow !== null ? `${formatNarratorNumber(Math.round(avgLow))} bpm` : "indisponivel"}.`}
                              >
                                <View className="flex-row items-center gap-2">
                                  <View
                                    className="w-8 h-8 rounded-full items-center justify-center"
                                    style={{
                                      backgroundColor: colors.semantic.success,
                                    }}
                                  >
                                    <Feather
                                      name="trending-down"
                                      size={16}
                                      color="#166534"
                                      accessible={false}
                                    />
                                  </View>
                                  <Text
                                    className={`text-sm font-open-sans ${ts}`}
                                    accessible={false}
                                  >
                                    Média Baixa
                                  </Text>
                                </View>
                                <Text
                                  className="text-lg font-bold font-safiro"
                                  style={{ color: colors.semantic.success }}
                                  accessible={false}
                                >
                                  {avgLow !== null ? Math.round(avgLow) : "--"}
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      })()}
                    </View>
                  ) : resolvedType !== "o2" ? (
                    <View
                      className={`rounded-3xl p-5 border mb-5 ${cardBg}`}
                      style={shadow}
                      accessible
                      focusable
                      importantForAccessibility="yes"
                      accessibilityRole="image"
                      accessibilityLabel={`Grafico de historico. Ultimas ${chartData.length} leituras. Valor mais recente ${spokenChartLatest}.`}
                    >
                      <View className="flex-row justify-between items-center mb-4">
                        <Text
                          className="text-base font-safiro"
                          style={{ color: tAccent }}
                        >
                          Histórico
                        </Text>
                        <Text className={`text-xs font-open-sans ${ts}`}>
                          {rangeDescription}
                        </Text>
                      </View>
                      {showGroupedView && groupedDays.length > 0 ? (
                        <>
                          <View className="items-center">
                            <MetricRangeBars
                              groups={groupedDays}
                              range={selectedRange}
                              isDark={isDark}
                              accentColor={config.accent}
                              {...(config.yMin !== undefined
                                ? { yMin: config.yMin }
                                : {})}
                              {...(config.yMax !== undefined
                                ? { yMax: config.yMax }
                                : {})}
                            />
                          </View>
                          <View className="flex-row items-center gap-2 mt-2 justify-center">
                            <View
                              className="w-3 h-3 rounded-full opacity-40"
                              style={{ backgroundColor: config.accent }}
                            />
                            <Text className={`text-xs font-open-sans ${ts}`}>
                              amplitude min–máx
                            </Text>
                            <View
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: config.accent }}
                            />
                            <Text className={`text-xs font-open-sans ${ts}`}>
                              média
                            </Text>
                          </View>
                        </>
                      ) : (
                        <LineChartSlim
                          data={chartData}
                          labels={chartLabels}
                          showXLabels={chartLabels.length === chartData.length}
                          showDots={selectedRange === "week"}
                          hideDotsAtIndex={weeklyMeasuredDotIndexes}
                          width={screenWidth - 72}
                          height={180}
                          lineColor={config.lineColor}
                          gradientFrom={config.gradientColor}
                          gradientTo={config.gradientColor}
                          gradientFromOpacity={0.28}
                          gradientToOpacity={0}
                          yAxisSuffix={config.yAxisSuffix}
                          segments={config.segments}
                          fromZero={isCumulativeMetric}
                          {...(config.yMin !== undefined
                            ? { yMin: config.yMin }
                            : {})}
                          {...(config.yMax !== undefined
                            ? { yMax: config.yMax }
                            : {})}
                        />
                      )}
                    </View>
                  ) : null}

                  {/* ── Stats Cards (Total/Avg · Máximo · Mínimo) ─────────── */}
                  {activeValues.length > 0 && (
                    <View className="flex-row flex-wrap gap-3 mb-4">
                      {/* Total (cumulativo) ou Média (intervalo) */}
                      <View
                        className={`rounded-2xl p-4 border ${cardBg}`}
                        style={[
                          shadow,
                          { minWidth: (screenWidth - 56) / 2 - 6, flex: 1 },
                        ]}
                        accessible
                        accessibilityRole="text"
                        accessibilityLabel={`${isCumulativeMetric ? "Total" : "Media"}. ${formatNarratorNumber(isCumulativeMetric ? periodTotal : periodAvg)} ${config.displayUnit}.`}
                      >
                        <View className="flex-row items-center gap-2 mb-2">
                          <View
                            className="w-7 h-7 rounded-lg items-center justify-center"
                            style={{ backgroundColor: `${config.accent}20` }}
                          >
                            <Feather
                              name="activity"
                              size={14}
                              color={config.accent}
                              accessible={false}
                            />
                          </View>
                          <Text
                            className="text-xs font-open-sans"
                            style={{ color: tAccent }}
                          >
                            {isCumulativeMetric ? "Total" : "Média"}
                          </Text>
                        </View>
                        <View className="flex-row items-baseline">
                          <Text
                            className={`text-2xl font-bold font-safiro ${tp}`}
                          >
                            {isCumulativeMetric
                              ? Math.round(periodTotal).toLocaleString("pt-PT")
                              : config.formatValue(periodAvg)}
                          </Text>
                          {config.displayUnit ? (
                            <Text className={`text-xs ml-1 ${tu}`}>
                              {config.displayUnit}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      {/* Máximo */}
                      <View
                        className={`rounded-2xl p-4 border ${cardBg}`}
                        style={[
                          shadow,
                          { minWidth: (screenWidth - 56) / 2 - 6, flex: 1 },
                        ]}
                        accessible
                        accessibilityRole="text"
                        accessibilityLabel={`Maximo. ${formatNarratorNumber(statsMax)} ${config.displayUnit}${statsMaxLabel ? `. ${statsMaxLabel}` : ""}.`}
                      >
                        <View className="flex-row items-center gap-2 mb-2">
                          <View
                            className="w-7 h-7 rounded-lg items-center justify-center"
                            style={{ backgroundColor: `${config.accent}20` }}
                          >
                            <Feather
                              name="trending-up"
                              size={14}
                              color={config.accent}
                              accessible={false}
                            />
                          </View>
                          <Text
                            className="text-xs font-open-sans"
                            style={{ color: tAccent }}
                          >
                            Máximo
                          </Text>
                        </View>
                        <View className="flex-row items-baseline">
                          <Text
                            className={`text-2xl font-bold font-safiro ${tp}`}
                          >
                            {config.formatValue(statsMax)}
                          </Text>
                          {config.displayUnit ? (
                            <Text className={`text-xs ml-1 ${tu}`}>
                              {config.displayUnit}
                            </Text>
                          ) : null}
                        </View>
                        {statsMaxLabel ? (
                          <Text className={`text-xs mt-1 font-open-sans ${ts}`}>
                            {statsMaxLabel}
                          </Text>
                        ) : null}
                      </View>

                      {/* Mínimo */}
                      <View
                        className={`rounded-2xl p-4 border ${cardBg}`}
                        style={[
                          shadow,
                          { minWidth: (screenWidth - 56) / 2 - 6, flex: 1 },
                        ]}
                        accessible
                        accessibilityRole="text"
                        accessibilityLabel={`Minimo. ${formatNarratorNumber(statsMin)} ${config.displayUnit}${statsMinLabel ? `. ${statsMinLabel}` : ""}.`}
                      >
                        <View className="flex-row items-center gap-2 mb-2">
                          <View
                            className="w-7 h-7 rounded-lg items-center justify-center"
                            style={{ backgroundColor: `${config.accent}20` }}
                          >
                            <Feather
                              name="trending-down"
                              size={14}
                              color={config.accent}
                              accessible={false}
                            />
                          </View>
                          <Text
                            className="text-xs font-open-sans"
                            style={{ color: tAccent }}
                          >
                            Mínimo
                          </Text>
                        </View>
                        <View className="flex-row items-baseline">
                          <Text
                            className={`text-2xl font-bold font-safiro ${tp}`}
                          >
                            {config.formatValue(statsMin)}
                          </Text>
                          {config.displayUnit ? (
                            <Text className={`text-xs ml-1 ${tu}`}>
                              {config.displayUnit}
                            </Text>
                          ) : null}
                        </View>
                        {statsMinLabel ? (
                          <Text className={`text-xs mt-1 font-open-sans ${ts}`}>
                            {statsMinLabel}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </SafeAreaView>
        </View>
      </LightBackground>
    </>
  );
}
