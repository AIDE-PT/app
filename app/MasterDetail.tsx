import BackButton from "@/components/buttons/backButton";
import LightBackground from "@/components/DotBackground";
import LineChartSlim from "@/components/charts/LineChartSlim";
import { useTheme } from "@/hooks/useTheme";
import { useHealthMetric, useMetricStats } from "@/hooks/useLatestMetric";
import { Feather } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
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
interface ExtraCard { label: string; value: string; unit: string; icon: string; }
interface MetricConfig {
  label: string; endpoint: string; displayUnit: string;
  lineColor: string; gradientColor: string; yAxisSuffix: string;
  segments: number; yMin?: number; yMax?: number;
  accent: string; accentLight: string;
  getStatus: (v: number) => MetricStatus;
  statusLabel: (s: MetricStatus) => string;
  extraCards: (h: number[], s: { min: number; max: number } | null, current: number) => ExtraCard[];
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

interface PatternIndicator {
  level: PatternLevel;
  label: string;
  icon: "chevron-down" | "minus" | "chevron-up";
  color: string;
}

const calcAvg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

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

  if (previousAvg === 0) return "Tendencia: sem referencia suficiente para comparar.";

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
  const speechUnit = config.displayUnit === "%" ? "por cento" : config.displayUnit;
  const toSpeechNumber = (value: string) => value
    .replace(/\s+/g, "")
    .replace(/[,.]/g, " virgula ")
    .replace(/\s+/g, " ")
    .trim();
  const valueText = `${toSpeechNumber(config.formatValue(current))}${speechUnit ? ` ${speechUnit}` : ""}`;
  const rangeText = `${toSpeechNumber(config.formatValue(allTimeMin))}${speechUnit ? ` ${speechUnit}` : ""} ate ${toSpeechNumber(config.formatValue(allTimeMax))}${speechUnit ? ` ${speechUnit}` : ""}`;
  const recentReadings = history.slice(0, 5).map((v) => `${toSpeechNumber(config.formatValue(v))}${speechUnit ? ` ${speechUnit}` : ""}`);

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
    accessibilityLabel: [`Resumo acessivel de ${config.label}.`, ...lines].join(" "),
  };
}

// ─── Metric Configurations ────────────────────────────────────────────────────
const METRIC_CONFIGS: Record<string, MetricConfig> = {
  heart: {
    label: "Batimentos Cardíacos", endpoint: "bpm", displayUnit: "bpm",
    lineColor: "#7C89FF", gradientColor: "#7C89FF", yAxisSuffix: " bpm",
    segments: 4, accent: "#7C89FF", accentLight: "#E8EAFF",
    formatValue: (v) => Math.round(v).toString(),
    getStatus: (v) => v >= 60 && v <= 100 ? "normal" : v <= 120 ? "warning" : "alert",
    statusLabel: (s) => s === "normal" ? "Normal" : s === "warning" ? "Elevado" : "Crítico",
    extraCards: (h) => [],
  },
  stress: {
    label: "Nível de Stress", endpoint: "stress", displayUnit: "",
    lineColor: "#7C89FF", gradientColor: "#7C89FF", yAxisSuffix: "",
    segments: 4, yMin: 0, yMax: 100, accent: "#7C89FF", accentLight: "#E8EAFF",
    formatValue: (v) => Math.round(v).toString(),
    getStatus: (v) => v < 40 ? "normal" : v <= 70 ? "warning" : "alert",
    statusLabel: (s) => s === "normal" ? "Baixo" : s === "warning" ? "Moderado" : "Alto",
    extraCards: (h) => [],
  },
  steps: {
    label: "Passos", endpoint: "steps", displayUnit: "passos",
    lineColor: "#7C89FF", gradientColor: "#7C89FF", yAxisSuffix: "",
    segments: 4, accent: "#7C89FF", accentLight: "#E8EAFF",
    formatValue: (v) => Math.round(v).toLocaleString("pt-PT"),
    getStatus: () => "normal",
    statusLabel: () => "Ativo",
    extraCards: (h) => [],
  },
  temp: {
    label: "Temperatura Corporal", endpoint: "temperature", displayUnit: "ºC",
    lineColor: "#7C89FF", gradientColor: "#7C89FF", yAxisSuffix: " ºC",
    segments: 5, yMin: 35, yMax: 40, accent: "#7C89FF", accentLight: "#E8EAFF",
    formatValue: (v) => v.toFixed(1),
    getStatus: (v) => v >= 36.0 && v <= 37.5 ? "normal" : v <= 38.5 ? "warning" : "alert",
    statusLabel: (s) => s === "normal" ? "Normal" : s === "warning" ? "Febre Baixa" : "Febre Alta",
    extraCards: (h) => [
      { label: "Média", value: calcAvg(h).toFixed(1), unit: "ºC", icon: "thermometer" },
    ],
  },
  o2: {
    label: "Saturação de O₂", endpoint: "o2", displayUnit: "%",
    lineColor: "#7C89FF", gradientColor: "#7C89FF", yAxisSuffix: "%",
    segments: 4, yMin: 88, yMax: 100, accent: "#7C89FF", accentLight: "#E8EAFF",
    formatValue: (v) => Math.round(v).toString(),
    getStatus: (v) => v >= 96 ? "normal" : v >= 94 ? "warning" : "alert",
    statusLabel: (s) => s === "normal" ? "Normal" : s === "warning" ? "Baixo" : "Crítico",
    extraCards: (h) => [],
  },
  glycemia: {
    label: "Calorias", endpoint: "glycemia", displayUnit: "kcal",
    lineColor: "#7C89FF", gradientColor: "#7C89FF", yAxisSuffix: "",
    segments: 4, accent: "#7C89FF", accentLight: "#E8EAFF",
    formatValue: (v) => Math.round(v).toString(),
    getStatus: (v) => v < 1500 ? "warning" : v <= 2200 ? "normal" : "alert",
    statusLabel: (s) => s === "normal" ? "Na Meta" : s === "warning" ? "Abaixo" : "Acima",
    extraCards: (h) => [
      { label: "Queimadas", value: Math.round(calcAvg(h)).toString(), unit: "kcal", icon: "zap" },
      { label: "Meta", value: "2 000", unit: "kcal", icon: "flag" },
      { label: "Progresso", value: `${Math.min(Math.round((calcAvg(h) / 2000) * 100), 100)}`, unit: "%", icon: "percent" },
    ],
  },
};

const DEFAULT_TYPE = "heart";
const BRAND_BLUE = "#7C89FF";
const HIGHLIGHT_BLUE = "#7C89FF";

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  const safeHex = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
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
  const mix = (start: number, end: number) => Math.round(start + (end - start) * weight);

  return `rgb(${mix(from.r, to.r)}, ${mix(from.g, to.g)}, ${mix(from.b, to.b)})`;
};

const buildStatusPalette = (semantic: {
  success: string;
  warning: string;
  danger: string;
}, isDark: boolean): Record<MetricStatus, { bg: string; text: string; border: string }> => ({
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
      return {
        min: 0,
        max: 14000,
        bands: [
          { label: "Abaixo", min: 0, max: 7000, color: semantic.warning },
          { label: "Na Meta", min: 7000, max: 10000, color: semantic.success },
          { label: "Acima", min: 10000, max: 14000, color: "#93C5FD" },
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
  const cx = size / 2, cy = size / 2;
  const trackColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.14)";
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const rings = [
    { r: 46, min: 0,  max: 40,  color: semantic.success, label: "Baixo"    },
    { r: 66, min: 40, max: 70,  color: semantic.warning, label: "Moderado" },
    { r: 86, min: 70, max: 100, color: semantic.danger, label: "Alto"     },
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
            <Stop offset="0%" stopColor={ring.color} stopOpacity={isDark ? 0.5 : 0.82} />
            <Stop offset="100%" stopColor={ring.color} stopOpacity={isDark ? 1 : 0.98} />
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
            <Circle cx={cx} cy={cy} r={ring.r} fill="none" stroke={trackColor} strokeWidth={isActive ? activeStroke : inactiveStroke} />
            {pct > 0 && (
              <Circle cx={cx} cy={cy} r={ring.r} fill="none"
                stroke={`url(#hg${i})`} strokeWidth={isActive ? activeStroke : inactiveStroke}
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
      <SvgText x={cx} y={cy - 10} fontSize="38" fontWeight="800"
        fill={isDark ? "#FFF" : "#111827"} textAnchor="middle">{Math.round(value)}</SvgText>
      <SvgText x={cx} y={cy + 14} fontSize="13"
        fill={isDark ? "rgba(255,255,255,0.62)" : "#6B7280"} textAnchor="middle">{centerLabel}</SvgText>
      {rings.map((ring) => (
        <SvgText key={ring.label} x={cx + ring.r + 8} y={cy + 4}
          fontSize="8.5" fill={isDark ? "rgba(255,255,255,0.56)" : "#6B7280"}
          textAnchor="start">{ring.label}</SvgText>
      ))}
    </Svg>
  );
}

// ─── O2: Semi-circle gauge with colored zones ─────────────────────────────────
function O2RangeColumns({
  history,
  currentValue,
  isDark,
  semantic,
}: {
  history: number[];
  currentValue: number;
  isDark: boolean;
  semantic: { success: string; warning: string; danger: string };
}) {
  const W = screenWidth - 80;
  const H = 220;
  const pL = 34, pR = 10, pT = 12, pB = 32;
  const cW = W - pL - pR;
  const cH = H - pT - pB;
  const yMin = 85, yMax = 100;

  // Build per-day buckets: group history into ~28 buckets
  const raw = history.length >= 2 ? [...history].reverse() : Array(14).fill(currentValue);
  const bucketCount = Math.min(raw.length, 28);
  const bucketSize = Math.max(1, Math.floor(raw.length / bucketCount));
  const buckets = Array.from({ length: bucketCount }, (_, i) => {
    const slice = raw.slice(i * bucketSize, i * bucketSize + bucketSize);
    const lo = Math.min(...slice);
    const hi = Math.max(...slice);
    return { lo, hi, single: lo === hi };
  });

  const toY = (v: number) => pT + cH * (1 - (Math.min(Math.max(v, yMin), yMax) - yMin) / (yMax - yMin));
  const toX = (i: number) => pL + (i / (bucketCount - 1)) * cW;

  const barW = Math.max(3, (cW / bucketCount) * 0.55);
  const dotR = Math.max(2.5, barW * 0.55);

  // Y-axis grid lines
  const yTicks = [85, 90, 95, 100];
  const textColor = isDark ? "rgba(255,255,255,0.62)" : "#6B7280";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const barColor = "#7C89FF";

  return (
    <View style={{ width: W, height: H, position: "relative" }}>
      <Svg width={W} height={H}>
        {/* Grid lines + Y labels */}
        {yTicks.map((t) => {
          const y = toY(t);
          return (
            <G key={t}>
              <Line x1={pL} y1={y} x2={W - pR} y2={y}
                stroke={gridColor} strokeWidth="1" strokeDasharray="4 4" />
              <SvgText x={pL - 4} y={y + 4} fontSize="9" fill={textColor} textAnchor="end">{t}</SvgText>
            </G>
          );
        })}
        {/* Range columns */}
        {buckets.map((b, i) => {
          const x = toX(i);
          const yLo = toY(b.lo);
          const yHi = toY(b.hi);
          if (b.single) {
            // Single dot when lo === hi
            return <Circle key={i} cx={x} cy={yHi} r={dotR} fill={barColor} opacity={0.85} />;
          }
          return (
            <G key={i}>
              {/* Vertical bar */}
              <Rect x={x - barW / 2} y={yHi} width={barW} height={yLo - yHi}
                rx={barW / 2} fill={barColor} opacity={0.8} />
              {/* Top dot */}
              <Circle cx={x} cy={yHi} r={dotR} fill={barColor} />
              {/* Bottom dot */}
              <Circle cx={x} cy={yLo} r={dotR} fill={barColor} />
            </G>
          );
        })}
        {/* X-axis baseline */}
        <Line x1={pL} y1={H - pB} x2={W - pR} y2={H - pB}
          stroke={gridColor} strokeWidth="1" />
        {/* X labels: first and last */}
        <SvgText x={pL} y={H - pB + 14} fontSize="9" fill={textColor} textAnchor="start">-{bucketCount}d</SvgText>
        <SvgText x={W - pR} y={H - pB + 14} fontSize="9" fill={textColor} textAnchor="end">hoje</SvgText>
      </Svg>

      {buckets.map((b, i) => {
        const x = toX(i);
        const yLo = toY(b.lo);
        const yHi = toY(b.hi);
        const daysAgo = bucketCount - 1 - i;
        const midpoint = (b.lo + b.hi) / 2;
        const indicator = getO2PatternIndicator(midpoint, semantic);
        const entryLabel = b.single
          ? `${getRelativeDayLabel(daysAgo)}. Saturação ${Math.round(b.hi)} por cento. Indicador ${indicator.label}.`
          : `${getRelativeDayLabel(daysAgo)}. Intervalo de saturação de ${Math.round(b.lo)} a ${Math.round(b.hi)} por cento. Indicador ${indicator.label}.`;
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
              backgroundColor: isDark ? "rgba(15,23,42,0.82)" : "rgba(255,255,255,0.92)",
            }}
          >
            <Feather name={indicator.icon} size={10} color={indicator.color} />
          </View>
        );
      })}
    </View>
  );
}

// ─── STEPS: Bar chart (14 days) + progress line overlay ──────────────────────
function StepsBars({
  data,
  isDark,
  semantic,
}: {
  data: number[];
  isDark: boolean;
  semantic: { success: string; warning: string; danger: string };
}) {
  const W = screenWidth - 80;
  const H = 180;
  const pL = 10, pR = 10, pT = 16, pB = 28;
  const cW = W - pL - pR, cH = H - pT - pB;
  const bars = data.slice(0, 14).reverse();
  const maxVal = Math.max(...bars, 1);
  const bW = (cW / bars.length) * 0.52;
  const gW = (cW / bars.length) * 0.48;
  const trackColor = isDark ? "rgba(255,255,255,0.05)" : "#EFF6FF";
  const textColor = isDark ? "rgba(255,255,255,0.56)" : "#64748B";

  const pts = bars.map((v, i) => ({
    x: pL + i * (bW + gW) + bW / 2,
    y: pT + cH - (v / maxVal) * cH,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
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
          <Line key={i} x1={pL} y1={pT + cH * (1 - f)} x2={pL + cW} y2={pT + cH * (1 - f)}
            stroke={trackColor} strokeWidth="1" />
        ))}
        {/* Bars */}
        {bars.map((v, i) => {
          const x = pL + i * (bW + gW);
          const bH = Math.max((v / maxVal) * cH, 2);
          const y = pT + cH - bH;
          const today = i === bars.length - 1;
          return (
            <G key={i}>
              <Rect x={x} y={pT} width={bW} height={cH} rx={3} fill={trackColor} />
              <Rect x={x} y={y} width={bW} height={bH} rx={3}
                fill={today ? "#7C89FF" : "#B8BEFF"} opacity={today ? 1 : 0.75} />
            </G>
          );
        })}
        {/* Area + Line */}
        <Path d={areaPath} fill="url(#sbAreaGrad)" clipPath="url(#sbClip)" />
        <Path d={linePath} fill="none" stroke="#7C89FF" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" clipPath="url(#sbClip)" />
        {/* Axis */}
        <SvgText x={pL + cW} y={H - 6} fontSize="9" fill={textColor} textAnchor="end">hoje</SvgText>
        <SvgText x={pL} y={H - 6} fontSize="9" fill={textColor} textAnchor="start">-14d</SvgText>
      </Svg>

      {bars.map((v, i) => {
        const x = pL + i * (bW + gW);
        const bH = Math.max((v / maxVal) * cH, 2);
        const y = pT + cH - bH;
        const daysAgo = bars.length - 1 - i;
        const indicator = getStepsPatternIndicator(v, semantic);
        const entryLabel = `${getRelativeDayLabel(daysAgo)}. ${Math.round(v).toLocaleString("pt-PT")} passos. Indicador ${indicator.label}.`;
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
              backgroundColor: isDark ? "rgba(15,23,42,0.82)" : "rgba(255,255,255,0.92)",
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
  const W = 160, H = 230;
  const tubX = 40, tubW = 18;
  const bulbR = 15, bulbCY = H - 26;
  const tubeTop = 18, tubeBot = bulbCY - bulbR + 4;
  const tubeH = tubeBot - tubeTop;
  const min = 35, max = 40;
  const pct = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const fillH = tubeH * pct;
  const fillY = tubeBot - fillH;
  const fillColor = value <= 37.5 ? semantic.success : value <= 38.5 ? semantic.warning : semantic.danger;
  const trackColor = isDark ? "rgba(255,255,255,0.07)" : "#E5E7EB";
  const textColor = isDark ? "rgba(255,255,255,0.65)" : "#374151";
  const outlineColor = isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.09)";
  const ticks = [35, 36, 37, 37.5, 38, 38.5, 39, 40];
  return (
    <Svg width={W} height={H}>
      {/* Tube track */}
      <Rect x={tubX} y={tubeTop} width={tubW} height={tubeH} rx={tubW / 2} fill={trackColor} />
      {/* Fill (extends into bulb) */}
      <Rect x={tubX} y={fillY} width={tubW} height={fillH + bulbR}
        rx={tubW / 2} fill={fillColor} />
      {/* Tube outline */}
      <Rect x={tubX} y={tubeTop} width={tubW} height={tubeH} rx={tubW / 2}
        fill="none" stroke={outlineColor} strokeWidth="1.5" />
      {/* Bulb */}
      <Circle cx={tubX + tubW / 2} cy={bulbCY} r={bulbR} fill={fillColor} />
      <Circle cx={tubX + tubW / 2} cy={bulbCY} r={bulbR}
        fill="none" stroke={outlineColor} strokeWidth="1.5" />
      {/* Ticks + labels */}
      {ticks.map((t) => {
        const tp = (t - min) / (max - min);
        const tY = tubeBot - tubeH * tp;
        const major = Number.isInteger(t);
        return (
          <G key={t}>
            <Line x1={tubX + tubW} y1={tY} x2={tubX + tubW + (major ? 10 : 6)} y2={tY}
              stroke={outlineColor} strokeWidth="1.2" />
            {major && (
              <SvgText x={tubX + tubW + 14} y={tY + 4} fontSize="11" fill={textColor}>{t}°</SvgText>
            )}
            {t === 37.5 && (
              <SvgText x={tubX + tubW + 14} y={tY + 4} fontSize="9"
                fill={isDark ? semantic.warning : "#D97706"}>37.5°</SvgText>
            )}
          </G>
        );
      })}
      {/* Current value indicator */}
      {(() => {
        const arrowY = tubeBot - tubeH * pct;
        return (
          <>
            <Line x1={tubX - 2} y1={arrowY} x2={tubX - 14} y2={arrowY}
              stroke={fillColor} strokeWidth="2.5" strokeLinecap="round" />
            <SvgText x={tubX - 17} y={arrowY + 4} fontSize="11" fontWeight="700"
              fill={fillColor} textAnchor="end">{value.toFixed(1)}°</SvgText>
          </>
        );
      })()}
    </Svg>
  );
}

// ─── CALORIES: Radial sunburst / spoke burst ─────────────────────────────────
function CalBurst({ value, isDark }: { value: number; isDark: boolean }) {
  const size = 220, cx = size / 2, cy = size / 2;
  const goal = 2000;
  const pct = Math.min(value / goal, 1);
  const numSpokes = 36;
  const innerR = 42, outerR = 88;
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
        const wobble = filled ? innerR + (outerR - innerR) * (0.55 + 0.45 * Math.abs(Math.sin(toRad(i * 53)))) : innerR + (outerR - innerR) * 0.18;
        const x1 = cx + innerR * Math.cos(toRad(angle));
        const y1 = cy + innerR * Math.sin(toRad(angle));
        const x2 = cx + wobble * Math.cos(toRad(angle));
        const y2 = cy + wobble * Math.sin(toRad(angle));
        return (
          <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={filled ? "url(#cbGrad)" : trackColor}
            strokeWidth={filled ? 4.5 : 2.5} strokeLinecap="round" />
        );
      })}
      <Circle cx={cx} cy={cy} r={innerR - 3}
        fill={isDark ? "#1C2030" : "#F5F6FF"}
        stroke={isDark ? "rgba(255,255,255,0.07)" : "#E8EAFF"} strokeWidth="1.5" />
      <SvgText x={cx} y={cy - 10} fontSize="30" fontWeight="800"
        fill={isDark ? "#FFF" : "#111827"} textAnchor="middle">{Math.round(value)}</SvgText>
      <SvgText x={cx} y={cy + 10} fontSize="10"
        fill={isDark ? "rgba(255,255,255,0.62)" : "#6B7280"} textAnchor="middle">kcal</SvgText>
      <SvgText x={cx} y={cy + 26} fontSize="9"
        fill="#7C89FF" textAnchor="middle">{Math.round(pct * 100)}% meta</SvgText>
    </Svg>
  );
}

// ─── STRESS/HEART: EEG-style symmetric waveform bars ────────────────────────
function StressWave({ value, history, isDark, colorFn, indicatorFn }: {
  value: number; history: number[]; isDark: boolean;
  colorFn?: (v: number) => string;
  indicatorFn?: (v: number) => PatternIndicator;
}) {
  const W = screenWidth - 80, H = 150;
  const bars = history.slice(0, 24).reverse();
  if (bars.length < 2) return null;
  const midY = H / 2;
  const bW = (W / bars.length) * 0.5;
  const gW = (W / bars.length) * 0.5;
  const stressColor = (v: number) => v < 40 ? "#86EFAC" : v <= 70 ? "#FDE68A" : "#FCA5A5";
  const getColor = colorFn ?? stressColor;
  const maxVal = Math.max(...bars, 1);
  const normalize = (v: number) => v / maxVal;
  return (
    <View style={{ width: W, height: H, position: "relative" }}>
      <Svg width={W} height={H}>
        {bars.map((v, i) => {
          const halfH = normalize(v) * (H * 0.43);
          const x = i * (bW + gW);
          const color = getColor(v);
          return (
            <G key={i}>
              <Rect x={x} y={midY - halfH} width={bW} height={halfH}
                rx={bW / 2} fill={color} opacity="0.9" />
              <Rect x={x} y={midY} width={bW} height={halfH}
                rx={bW / 2} fill={color} opacity="0.45" />
            </G>
          );
        })}
        <Line x1={0} y1={midY} x2={W} y2={midY}
          stroke={isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.08)"}
          strokeWidth="1" strokeDasharray="4,4" />
        <SvgText x={W - 4} y={14} fontSize="11" fontWeight="700"
          fill={getColor(value)} textAnchor="end">{Math.round(value)}</SvgText>
      </Svg>

      {bars.map((v, i) => {
        const halfH = normalize(v) * (H * 0.43);
        const x = i * (bW + gW);
        const daysAgo = bars.length - 1 - i;
        const indicator = indicatorFn?.(v);
        const entryLabel = `${getRelativeDayLabel(daysAgo)}. Valor ${Math.round(v)}.${indicator ? ` Indicador ${indicator.label}.` : ""}`;
        return (
          <Pressable
            key={`wave-hit-${i}`}
            style={[
              styles.chartHit,
              {
                left: x,
                top: midY - halfH,
                width: Math.max(bW, 18),
                height: Math.max(halfH * 2, 28),
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

      {indicatorFn && bars.map((v, i) => {
        const halfH = normalize(v) * (H * 0.43);
        const x = i * (bW + gW);
        const indicator = indicatorFn(v);
        return (
          <View
            key={`wave-pattern-${i}`}
            pointerEvents="none"
            accessible={false}
            style={{
              position: "absolute",
              left: x + bW / 2 - 8,
              top: Math.max(2, midY - halfH - 18),
              width: 16,
              height: 16,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isDark ? "rgba(15,23,42,0.82)" : "rgba(255,255,255,0.92)",
            }}
          >
            <Feather name={indicator.icon} size={10} color={indicator.color} />
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

// ─── Zone List ────────────────────────────────────────────────────────────────
function ZoneList({ zones, value, isDark }: {
  zones: { label: string; range: [number, number]; color: string; display: string }[];
  value: number; isDark: boolean;
}) {
  const ts = isDark ? "text-gray-300" : "text-gray-600";
  return (
    <>
      {zones.map((z) => {
        const active = value >= z.range[0] && value < z.range[1];
        return (
          <View key={z.label} className="flex-row items-center mb-2 px-3 py-2 rounded-xl"
            style={active ? { borderWidth: 1, borderColor: z.color, backgroundColor: `${z.color}22` } : undefined}>
            <View className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: z.color }} />
            <Text className="text-sm font-open-sans flex-1"
              style={{ color: BRAND_BLUE, fontWeight: active ? "700" : "400" }}>{z.label}</Text>
            <Text className={`text-xs font-open-sans ${ts}`}>{z.display}</Text>
            {active && <View className="ml-2 w-2 h-2 rounded-full" style={{ backgroundColor: z.color }} />}
          </View>
        );
      })}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function MasterDetail() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const resolvedType = type && METRIC_CONFIGS[type] ? type : DEFAULT_TYPE;
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

  const { data: metricData, isLoading } = useHealthMetric(config.endpoint);
  const { data: stats } = useMetricStats(config.endpoint);

  const currentRaw: number = metricData?.latest?.value ?? 0;
  const history: number[] = metricData?.history ?? [];
  const chartData = history.length >= 2 ? [...history].reverse() : [0, 0];
  const allTimeMin = stats?.min ?? (history.length ? Math.min(...history) : 0);
  const allTimeMax = stats?.max ?? (history.length ? Math.max(...history) : 0);

  const status = config.getStatus(currentRaw);
  const palette = buildStatusPalette(colors.semantic, isDark)[status];
  const extraCards = config.extraCards(history, stats ?? null, currentRaw);
  const accessibleSummary = buildAccessibleSummary({
    type: resolvedType,
    config,
    current: currentRaw,
    statusLabel: config.statusLabel(status),
    history,
    allTimeMin,
    allTimeMax,
  });
  const lastAnnouncedSummaryRef = useRef<string>("");

  useEffect(() => {
    if (isLoading || !accessibleSummary.accessibilityLabel) return;
    if (lastAnnouncedSummaryRef.current === accessibleSummary.accessibilityLabel) return;

    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      if (!enabled) return;
      AccessibilityInfo.announceForAccessibility(accessibleSummary.accessibilityLabel);
      lastAnnouncedSummaryRef.current = accessibleSummary.accessibilityLabel;
    });
  }, [isLoading, accessibleSummary.accessibilityLabel]);

  const cardBg = isDark ? "bg-aide-dark-card border-white/10" : "bg-white border-gray-100";
  const shadow = { boxShadow: "0 2px 12px 0 rgba(0,0,0,0.08)" } as any;
  const tp = isDark ? "text-white" : "text-black";
  const ts = isDark ? "text-gray-300" : "text-gray-600";
  const tu = isDark ? "text-gray-300" : "text-black";
  const tAccent = config.accent;
  const heroTitle = resolvedType === "heart" ? "Batimentos Cardíacos" : config.label;
  const heroValue = config.formatValue(currentRaw);
  const heroDigits = `${Math.abs(Math.trunc(currentRaw))}`.length;
  const heroFontSize = resolvedType === "steps"
    ? (heroDigits >= 6 ? 54 : heroDigits >= 5 ? 60 : 68)
    : 68;
  const heroLineHeight = resolvedType === "steps"
    ? (heroDigits >= 6 ? 58 : heroDigits >= 5 ? 64 : 72)
    : 72;
  const standardizedScale = getStandardizedMetricScale(resolvedType, colors.semantic);
  const rangeSpan = standardizedScale.max - standardizedScale.min;
  const clampedCurrent = Math.min(Math.max(currentRaw, standardizedScale.min), standardizedScale.max);
  const markerPercent = rangeSpan > 0
    ? ((clampedCurrent - standardizedScale.min) / rangeSpan) * 100
    : 0;
  const activeBand = standardizedScale.bands.find((band, index) => {
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
        const base = rest === 0 ? `${thousands} mil` : `${thousands} mil ${rest}`;
        return value < 0 ? `menos ${base}` : base;
      }
      return `${value}`;
    }
    const fixed = value.toFixed(1).replace(".", " virgula ");
    return value < 0 ? `menos ${fixed.replace("-", "")}` : fixed;
  };
  const spokenUnit = config.displayUnit === "%" ? "por cento" : config.displayUnit;
  const spokenCurrent = `${formatNarratorNumber(currentRaw)}${spokenUnit ? ` ${spokenUnit}` : ""}`;
  const spokenDailyAverage = `${formatNarratorNumber(Math.round(calcAvg(history)))} passos`;
  const spokenMax = `${formatNarratorNumber(allTimeMax)}${spokenUnit ? ` ${spokenUnit}` : ""}`;
  const spokenMin = `${formatNarratorNumber(allTimeMin)}${spokenUnit ? ` ${spokenUnit}` : ""}`;
  const heroAccessibilityLabel = resolvedType === "steps"
    ? `${heroTitle}. Valor atual ${spokenCurrent}. Estado ${config.statusLabel(status)}. Media diaria ${spokenDailyAverage}. Meta 10 mil passos.`
    : `${heroTitle}. Valor atual ${spokenCurrent}. Estado ${config.statusLabel(status)}. Maximo ${spokenMax}. Minimo ${spokenMin}.`;
  const chartLatest = chartData.length ? chartData[chartData.length - 1] : currentRaw;
  const spokenChartLatest = `${formatNarratorNumber(chartLatest)}${spokenUnit ? ` ${spokenUnit}` : ""}`;
  const heartAvg = chartData.length ? calcAvg(chartData) : null;
  const heartHighs = chartData.filter((v) => v > 100);
  const heartLows = chartData.filter((v) => v < 60);
  const heartAvgHigh = heartHighs.length ? calcAvg(heartHighs) : null;
  const heartAvgLow = heartLows.length ? calcAvg(heartLows) : null;

  const HEART_ZONES: { label: string; range: [number, number]; color: string; display: string }[] = [
    { label: "Repouso",  range: [40, 60],   color: "#93C5FD", display: "40 – 60 bpm" },
    { label: "Normal",   range: [60, 100],  color: colors.semantic.success, display: "60 – 100 bpm" },
    { label: "Elevado",  range: [100, 140], color: colors.semantic.warning, display: "100 – 140 bpm" },
    { label: "Máximo",   range: [140, 999], color: colors.semantic.danger, display: "≥ 140 bpm" },
  ];
  const TEMP_ZONES: { label: string; range: [number, number]; color: string; display: string }[] = [
    { label: "Hipotermia",  range: [0, 36],    color: "#93C5FD", display: "< 36 ºC" },
    { label: "Normal",      range: [36, 37.5], color: colors.semantic.success, display: "36 – 37.5 ºC" },
    { label: "Febre Baixa", range: [37.5, 38.5], color: colors.semantic.warning, display: "37.5 – 38.5 ºC" },
    { label: "Febre Alta",  range: [38.5, 999], color: colors.semantic.danger, display: "≥ 38.5 ºC" },
  ];
  const O2_LEGEND = [
    { label: "Normal",  desc: "≥ 96%",  color: colors.semantic.success },
    { label: "Baixo",   desc: "94–95%", color: colors.semantic.warning },
    { label: "Crítico", desc: "< 94%",  color: colors.semantic.danger },
  ];
  const STRESS_LEGEND = [
    { label: "Baixo",    desc: "< 40",  color: colors.semantic.success },
    { label: "Moderado", desc: "40–70", color: colors.semantic.warning },
    { label: "Alto",     desc: "> 70",  color: colors.semantic.danger },
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
              <ScrollView className="flex-1" showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 48 }}>

                <View
                  accessible
                  collapsable={false}
                  importantForAccessibility="yes"
                  accessibilityLabel={accessibleSummary.accessibilityLabel}
                  style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
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
                      <Text className="text-base font-safiro" style={{ color: config.accent }}>
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
                        <Text style={{
                          color: isDark ? "#FFFFFF" : "#111827",
                          fontSize: heroFontSize,
                          lineHeight: heroLineHeight,
                          fontWeight: "800",
                          letterSpacing: -2,
                        }} className="font-open-sans" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} accessible={false}>{heroValue}</Text>
                        <Text className={`text-base font-medium ${tu}`} accessible={false}>{config.displayUnit}</Text>
                      </View>
                      <View className="self-start flex-row items-center gap-1.5 px-4 py-1.5 rounded-full"
                        style={{ backgroundColor: palette.bg, borderWidth: 1, borderColor: palette.border }}>
                        <Feather
                          name={status === "normal" ? "check-circle" : status === "warning" ? "alert-circle" : "alert-triangle"}
                          size={13} color={palette.text} accessible={false} />
                        <Text className="text-xs font-bold font-open-sans" style={{ color: palette.text }}>
                          {config.statusLabel(status)}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end gap-3 flex-shrink-0" style={{ width: 120 }}>
                      {resolvedType === "steps" ? (
                        <>
                          <View className="items-end" accessible accessibilityRole="text" accessibilityLabel={`Media diaria ${spokenDailyAverage}.`}>
                            <View className="flex-row items-baseline">
                              <Text className={`text-2xl font-bold font-open-sans ${tp}`} accessible={false}>{Math.round(calcAvg(history)).toLocaleString("pt-PT")}</Text>
                              <Text className={`text-xs ml-1 ${tu}`} accessible={false}>passos</Text>
                            </View>
                            <Text className="text-xs font-open-sans mt-0.5" style={{ color: tAccent }} accessible={false}>Média Diária</Text>
                          </View>
                          <View className={`w-10 h-[2px] ${isDark ? "bg-white/15" : "bg-gray-300"}`} />
                          <View className="items-end" accessible accessibilityRole="text" accessibilityLabel="Meta 10 mil passos.">
                            <View className="flex-row items-baseline">
                              <Text className={`text-2xl font-bold font-open-sans ${tp}`} accessible={false}>10 000</Text>
                              <Text className={`text-xs ml-1 ${tu}`} accessible={false}>passos</Text>
                            </View>
                            <Text className="text-xs font-open-sans mt-0.5" style={{ color: tAccent }} accessible={false}>Meta</Text>
                          </View>
                        </>
                      ) : (
                        <>
                          <View className="items-end" accessible accessibilityRole="text" accessibilityLabel={`Maximo ${spokenMax}.`}>
                            <View className="flex-row items-baseline">
                              <Text className={`text-2xl font-bold font-open-sans ${tp}`} accessible={false}>{allTimeMax}</Text>
                              <Text className={`text-xs ml-1 ${tu}`} accessible={false}>{config.displayUnit}</Text>
                            </View>
                            <Text className="text-xs font-open-sans mt-0.5" style={{ color: tAccent }} accessible={false}>Máximo</Text>
                          </View>
                          <View className={`w-10 h-[2px] ${isDark ? "bg-white/15" : "bg-gray-300"}`} />
                          <View className="items-end" accessible accessibilityRole="text" accessibilityLabel={`Minimo ${spokenMin}.`}>
                            <View className="flex-row items-baseline">
                              <Text className={`text-2xl font-bold font-open-sans ${tp}`} accessible={false}>{allTimeMin}</Text>
                              <Text className={`text-xs ml-1 ${tu}`} accessible={false}>{config.displayUnit}</Text>
                            </View>
                            <Text className="text-xs font-open-sans mt-0.5" style={{ color: tAccent }} accessible={false}>Mínimo</Text>
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
                  <View className={`rounded-3xl p-5 border mb-5 ${cardBg}`} style={shadow}>
                    <View className="flex-row items-center justify-between mb-4">
                      <Text className="text-base font-safiro" style={{ color: config.accent }}>
                        Perfil Cardíaco
                      </Text>
                      <View className="flex-row gap-4">
                        {[{color:colors.semantic.success,label:"Normal"},{color:colors.semantic.warning,label:"Elevado"},{color:colors.semantic.danger,label:"Crítico"}].map((r) => (
                          <View
                            key={r.label}
                            className="items-center gap-0.5"
                            accessible
                            accessibilityRole="text"
                            accessibilityLabel={`Legenda cardíaca: ${r.label}.`}
                          >
                            <View className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} accessible={false} />
                            <Text className="text-xs font-open-sans"
                              style={{ color: isDark ? "rgba(255,255,255,0.62)" : "#6B7280" }} accessible={false}>{r.label}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    <View
                      className="items-center"
                      accessible={false}
                      importantForAccessibility="no"
                    >
                      <StressWave value={currentRaw} history={history} isDark={isDark}
                        indicatorFn={(v) => getHeartPatternIndicator(v, colors.semantic)}
                        colorFn={(v) => v <= 60 ? "#93C5FD" : v <= 100 ? colors.semantic.success : v <= 140 ? colors.semantic.warning : colors.semantic.danger} />
                    </View>
                    <View className="flex-row h-2 rounded-full overflow-hidden mt-4">
                      <View style={{ flex: 20, backgroundColor: "#93C5FD" }} />
                      <View style={{ flex: 40, backgroundColor: colors.semantic.success }} />
                      <View style={{ flex: 30, backgroundColor: colors.semantic.warning }} />
                      <View style={{ flex: 10, backgroundColor: colors.semantic.danger }} />
                    </View>
                    <View className="flex-row justify-between mt-1">
                      {["40","60","100","140+"].map((v) => (
                        <Text key={v} className={`text-xs font-open-sans ${ts}`}>{v}</Text>
                      ))}
                    </View>
                    <View
                      className="rounded-2xl p-3 mt-3"
                      style={{ backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#F6F7FF" }}
                      accessible
                      accessibilityRole="text"
                      accessibilityLabel="Indicadores do grafico cardiaco: seta para baixo indica batimento baixo, traco indica normal, seta para cima indica elevado ou critico."
                    >
                      <Text className={`text-xs font-open-sans mb-2 ${ts}`}>
                        Indicadores por barra
                      </Text>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-1.5">
                          <Feather name="chevron-down" size={12} color="#93C5FD" />
                          <Text className={`text-xs font-open-sans ${ts}`}>Baixo</Text>
                        </View>
                        <View className="flex-row items-center gap-1.5">
                          <Feather name="minus" size={12} color={colors.semantic.success} />
                          <Text className={`text-xs font-open-sans ${ts}`}>Normal</Text>
                        </View>
                        <View className="flex-row items-center gap-1.5">
                          <Feather name="chevron-up" size={12} color={colors.semantic.warning} />
                          <Text className={`text-xs font-open-sans ${ts}`}>Elevado</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* ── O2: Range column chart ──────────────────────────── */}
                {resolvedType === "o2" && (
                  <View className={`rounded-3xl p-5 border mb-5 ${cardBg}`} style={shadow}>
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-base font-safiro" style={{ color: config.accent }}>
                        Saturação Atual
                      </Text>
                      <Text className={`text-xs font-open-sans ${ts}`}>Intervalo diário</Text>
                    </View>
                    <View className="flex-row items-baseline gap-1 mb-3">
                      <Text style={{ color: isDark ? "#FFF" : "#111827", fontSize: 28, fontWeight: "800" }}
                        className="font-open-sans">
                        {allTimeMin}–{allTimeMax}
                      </Text>
                      <Text className={`text-sm font-open-sans ${tu}`}>%</Text>
                    </View>
                    <View
                      accessible={false}
                      importantForAccessibility="no"
                    >
                      <O2RangeColumns
                        history={history}
                        currentValue={currentRaw}
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
                          <View className="w-8 h-3 rounded-full" style={{ backgroundColor: r.color }} accessible={false} />
                          <Text className="text-xs font-open-sans" style={{ color: tAccent }} accessible={false}>{r.label}</Text>
                          <Text className={`text-xs font-open-sans ${ts}`} accessible={false}>{r.desc}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* ── STEPS: Bar + line chart ───────────────────────────── */}
                {resolvedType === "steps" && (
                  <View className={`rounded-3xl p-5 border mb-5 ${cardBg}`} style={shadow}>
                    <View className="flex-row items-center justify-between mb-4">
                      <Text className="text-base font-safiro" style={{ color: config.accent }}>
                        Passos Diários
                      </Text>
                      <Text className={`text-xs font-open-sans ${ts}`}>Últimos 14 dias</Text>
                    </View>
                    <View
                      className="items-center"
                      accessible={false}
                      importantForAccessibility="no"
                    >
                      <StepsBars
                        data={history.length >= 2 ? history : [0, 0]}
                        isDark={isDark}
                        semantic={colors.semantic}
                      />
                    </View>
                    <View className="mt-4">
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-xs font-open-sans" style={{ color: tAccent }}>Progresso para a meta</Text>
                        <Text className="text-xs font-bold font-open-sans" style={{ color: config.accent }}>
                          {Math.min(Math.round(((history[0] ?? 0) / 10000) * 100), 100)}%
                        </Text>
                      </View>
                      <View className={`h-3 rounded-full overflow-hidden ${isDark ? "bg-white/15" : "bg-blue-100"}`}>
                        <View className="h-3 rounded-full"
                          style={{ width: `${Math.min(((history[0] ?? 0) / 10000) * 100, 100)}%`, backgroundColor: config.accent }} />
                      </View>
                      <View className="flex-row justify-between mt-1">
                        <Text className={`text-xs font-open-sans ${ts}`}>0</Text>
                        <Text className={`text-xs font-open-sans ${ts}`}>10 000</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* ── TEMP: Thermometer ─────────────────────────────────── */}
                {resolvedType === "temp" && (
                  <View className={`rounded-3xl p-5 border mb-5 ${cardBg}`} style={shadow}>
                    <Text className="text-base font-safiro mb-4" style={{ color: config.accent }}>
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
                        <Thermometer value={currentRaw} isDark={isDark} semantic={colors.semantic} />
                      </View>
                      <View className="flex-1 gap-3 pl-2">
                        <Text className="text-xs font-open-sans" style={{ color: tAccent }}>Referência</Text>
                        {TEMP_ZONES.map((z) => {
                          const active = currentRaw >= z.range[0] && currentRaw < z.range[1];
                          return (
                            <View
                              key={z.label}
                              className="flex-row items-center gap-2 py-1.5 px-2.5 rounded-xl"
                              accessible
                              accessibilityRole="text"
                              accessibilityLabel={`${z.label}. Intervalo ${z.display}.${active ? " Zona atual." : ""}`}
                              style={active ? { backgroundColor: `${z.color}28`, borderWidth: 1, borderColor: z.color } : undefined}>
                              <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: z.color }} accessible={false} />
                              <View>
                                <Text className="text-xs font-open-sans"
                                  style={{ color: tAccent, fontWeight: active ? "700" : "400" }} accessible={false}>{z.label}</Text>
                                <Text className={`text-xs font-open-sans ${ts}`} accessible={false}>{z.display}</Text>
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
                  <View className={`rounded-3xl p-5 border mb-5 ${cardBg}`} style={shadow}>
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-base font-safiro" style={{ color: config.accent }}>
                        Calorias Queimadas
                      </Text>
                      <Text className={`text-xs font-open-sans ${ts}`}>Meta: 2 000 kcal</Text>
                    </View>
                    <View
                      className="items-center"
                      accessible
                      focusable
                      importantForAccessibility="yes"
                      accessibilityRole="image"
                      accessibilityLabel={`Grafico de calorias queimadas. Valor atual ${spokenCurrent}. Meta 2 mil kcal.`}
                    >
                      <CalBurst value={currentRaw} isDark={isDark} />
                    </View>
                    <View className={`h-2 rounded-full mt-2 ${isDark ? "bg-white/15" : "bg-orange-100"}`}>
                      <View className="h-2 rounded-full"
                        style={{ width: `${Math.min((currentRaw / 2000) * 100, 100)}%`, backgroundColor: config.accent }} />
                    </View>
                    <View className="flex-row justify-between mt-1">
                      <Text className={`text-xs font-open-sans ${ts}`}>0 kcal</Text>
                      <Text className={`text-xs font-open-sans ${ts}`}>2 000 kcal</Text>
                    </View>
                  </View>
                )}

                {/* ── STRESS: 3-Ring Concentric Circles ────────────────── */}
                {resolvedType === "stress" && (
                  <View className={`rounded-3xl p-5 border mb-5 ${cardBg}`} style={shadow}>
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-base font-safiro" style={{ color: config.accent }}>
                        Zonas de Stress
                      </Text>
                      <View className="flex-row gap-3">
                        {[{color:colors.semantic.success,label:"Baixo"},{color:colors.semantic.warning,label:"Moderado"},{color:colors.semantic.danger,label:"Alto"}].map((z) => (
                          <View
                            key={z.label}
                            className="flex-row items-center gap-1"
                            accessible
                            accessibilityRole="text"
                            accessibilityLabel={`Nivel de stress ${z.label}.`}
                          >
                            <View className="w-2 h-2 rounded-full" style={{ backgroundColor: z.color }} accessible={false} />
                            <Text className="text-xs font-open-sans"
                              style={{ color: isDark ? "rgba(255,255,255,0.62)" : "#6B7280" }} accessible={false}>{z.label}</Text>
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
                      <HeartTripleRings value={currentRaw} isDark={isDark} centerLabel="stress" semantic={colors.semantic} />
                    </View>
                    <View className="rounded-2xl p-3 mt-1"
                      style={{ backgroundColor: isDark ? "rgba(255,255,255,0.04)" : config.accentLight }}>
                      <Text className="text-xs font-open-sans text-center"
                        style={{ color: isDark ? "rgba(255,255,255,0.62)" : "#4B5563" }}>
                        Cada anel representa uma zona de stress. O ponto luminoso indica a progressão na zona atual.
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
                    <Text className="text-base font-safiro" style={{ color: tAccent }}>
                      Posição Atual da Métrica
                    </Text>
                    <View className="flex-row items-center gap-2 px-2 py-1 rounded-full">
                      <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeBand.color }} />
                      <Text className="text-xs font-open-sans" style={{ color: activeBand.color }}>{activeBand.label}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-baseline gap-1 mb-4">
                    <Text className={`text-2xl font-bold font-safiro ${tp}`}>{config.formatValue(currentRaw)}</Text>
                    <Text className={`text-sm font-open-sans ${tu}`}>{config.displayUnit}</Text>
                    <Text className={`text-xs font-open-sans ml-1 ${ts}`}>valor atual</Text>
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
                          style={isBandActive
                            ? {
                              borderColor: band.color,
                              backgroundColor: "transparent",
                            }
                            : {
                              borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
                              backgroundColor: "transparent",
                            }}
                        >
                          <View className="flex-row items-center gap-2.5">
                            <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: band.color }} accessible={false} />
                            <Text className="text-base font-open-sans" style={{ color: band.color, fontWeight: isBandActive ? "700" : "500" }} accessible={false}>
                              {band.label}
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-2">
                            <Text className={`text-sm font-open-sans ${ts}`} accessible={false}>{getBandRangeText(band, index)}</Text>
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
                      <Text className="text-base font-safiro" style={{ color: tAccent }}>Médias</Text>
                      <Text className={`text-xs font-open-sans ${ts}`}>Análise de padrões</Text>
                    </View>
                    {/* Average Visualization */}
                    {(() => {
                      const h = chartData || [];
                      if (!h.length) {
                        return (
                          <View className="items-center justify-center py-8">
                            <Text className={`text-sm ${ts}`}>Aguardando dados...</Text>
                          </View>
                        );
                      }
                      const avg = calcAvg(h);
                      const highs = h.filter(v => v > 100);
                      const lows = h.filter(v => v < 60);
                      const avgHigh = highs.length ? calcAvg(highs) : null;
                      const avgLow = lows.length ? calcAvg(lows) : null;

                      return (
                        <View className="flex-row items-center justify-between">
                          {/* Main Average Circle */}
                          <View className="items-center">
                            <View className="w-24 h-24 rounded-full items-center justify-center border-4"
                              style={{ borderColor: config.accent, backgroundColor: isDark ? "rgba(124,137,255,0.1)" : "#EEF0FF" }}>
                              <Text className="text-3xl font-bold font-safiro" style={{ color: config.accent }}>
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
                              style={{ backgroundColor: isDark ? "rgba(252,165,165,0.1)" : "#FEF2F2" }}
                              accessible
                              accessibilityRole="text"
                              accessibilityLabel={`Media alta. ${avgHigh !== null ? `${formatNarratorNumber(Math.round(avgHigh))} bpm` : "indisponivel"}.`}
                            >
                              <View className="flex-row items-center gap-2">
                                <View className="w-8 h-8 rounded-full items-center justify-center"
                                  style={{ backgroundColor: colors.semantic.danger }}>
                                  <Feather name="trending-up" size={16} color="#991B1B" accessible={false} />
                                </View>
                                <Text className={`text-sm font-open-sans ${ts}`} accessible={false}>Média Alta</Text>
                              </View>
                              <Text className="text-lg font-bold font-safiro" style={{ color: colors.semantic.danger }} accessible={false}>
                                {avgHigh !== null ? Math.round(avgHigh) : "--"}
                              </Text>
                            </View>

                            {/* Low */}
                            <View
                              className="rounded-xl p-3 flex-row items-center justify-between"
                              style={{ backgroundColor: isDark ? "rgba(134,239,172,0.1)" : "#F0FDF4" }}
                              accessible
                              accessibilityRole="text"
                              accessibilityLabel={`Media baixa. ${avgLow !== null ? `${formatNarratorNumber(Math.round(avgLow))} bpm` : "indisponivel"}.`}
                            >
                              <View className="flex-row items-center gap-2">
                                <View className="w-8 h-8 rounded-full items-center justify-center"
                                  style={{ backgroundColor: colors.semantic.success }}>
                                  <Feather name="trending-down" size={16} color="#166534" accessible={false} />
                                </View>
                                <Text className={`text-sm font-open-sans ${ts}`} accessible={false}>Média Baixa</Text>
                              </View>
                              <Text className="text-lg font-bold font-safiro" style={{ color: colors.semantic.success }} accessible={false}>
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
                      <Text className="text-base font-safiro" style={{ color: tAccent }}>Histórico</Text>
                      <Text className={`text-xs font-open-sans ${ts}`}>Últimas 20 leituras</Text>
                    </View>
                    <LineChartSlim
                      data={chartData}
                      width={screenWidth - 72}
                      height={180}
                      lineColor={config.lineColor}
                      gradientFrom={config.gradientColor}
                      gradientTo={config.gradientColor}
                      gradientFromOpacity={0.28}
                      gradientToOpacity={0}
                      yAxisSuffix={config.yAxisSuffix}
                      segments={config.segments}
                      {...(config.yMin !== undefined ? { yMin: config.yMin } : {})}
                      {...(config.yMax !== undefined ? { yMax: config.yMax } : {})}
                    />
                  </View>
                ) : null}

                {/* ── Extra Info Cards ──────────────────────────────────── */}
                <View className="flex-row flex-wrap gap-3 mb-4">
                  {extraCards.map((card) => (
                    <View key={card.label} className={`rounded-2xl p-4 border ${cardBg}`}
                      style={[shadow, { minWidth: (screenWidth - 56) / 2 - 6, flex: 1 }]}
                      accessible
                      accessibilityRole="text"
                      accessibilityLabel={`${card.label}. ${formatNarratorNumber(Number(card.value.replace(/\s/g, "")) || 0)}${card.unit ? ` ${card.unit === "%" ? "por cento" : card.unit}` : ""}.`}
                    >
                      <View className="flex-row items-center gap-2 mb-2">
                        <View className="w-7 h-7 rounded-lg items-center justify-center"
                          style={{ backgroundColor: `${config.accent}20` }}>
                          <Feather name={card.icon as any} size={14} color={config.accent} accessible={false} />
                        </View>
                        <Text className="text-xs font-open-sans" style={{ color: tAccent }}>{card.label}</Text>
                      </View>
                      <View className="flex-row items-baseline">
                        <Text className={`text-2xl font-bold font-safiro ${tp}`}>{card.value}</Text>
                        {card.unit ? <Text className={`text-xs ml-1 ${tu}`}>{card.unit}</Text> : null}
                      </View>
                    </View>
                  ))}
                </View>

              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      </LightBackground>
    </>
  );
}

