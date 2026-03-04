import BackButton from "@/components/buttons/backButton";
import LightBackground from "@/components/DotBackground";
import LineChartSlim from "@/components/charts/LineChartSlim";
import { useTheme } from "@/hooks/useTheme";
import { useHealthMetric, useMetricStats } from "@/hooks/useLatestMetric";
import { Feather } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
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

const calcAvg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

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

const STATUS_PALETTE: Record<MetricStatus, { bg: string; text: string; border: string }> = {
  normal:  { bg: "#DCFCE7", text: "#166534", border: "#86EFAC" },
  warning: { bg: "#FEF9C3", text: "#854D0E", border: "#FDE047" },
  alert:   { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
};

// ═══════════════════════════════════════════════════════════════════════════════
// UNIQUE VISUALIZATIONS PER METRIC
// ═══════════════════════════════════════════════════════════════════════════════

// ─── HEART: Triple concentric rings (rest / normal / elevated zones) ──────────
function HeartTripleRings({ value, isDark, centerLabel = "bpm" }: { value: number; isDark: boolean; centerLabel?: string }) {
  const size = 220;
  const cx = size / 2, cy = size / 2;
  const trackColor = isDark ? "rgba(255,255,255,0.07)" : "#F3F4F6";
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const rings = [
    { r: 46, min: 0,  max: 40,  color: "#86EFAC", label: "Baixo"    },
    { r: 66, min: 40, max: 70,  color: "#FDE68A", label: "Moderado" },
    { r: 86, min: 70, max: 100, color: "#FCA5A5", label: "Alto"     },
  ];
  const ringPct = (min: number, max: number) => {
    if (value <= min) return 0;
    if (value >= max) return 1;
    return (value - min) / (max - min);
  };
  return (
    <Svg width={size} height={size}>
      <Defs>
        {rings.map((ring, i) => (
          <LinearGradient key={i} id={`hg${i}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={ring.color} stopOpacity="0.5" />
            <Stop offset="100%" stopColor={ring.color} stopOpacity="1" />
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
            <Circle cx={cx} cy={cy} r={ring.r} fill="none" stroke={trackColor} strokeWidth={isActive ? 9 : 7} />
            {pct > 0 && (
              <Circle cx={cx} cy={cy} r={ring.r} fill="none"
                stroke={`url(#hg${i})`} strokeWidth={isActive ? 9 : 7}
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
        fill={isDark ? "rgba(255,255,255,0.45)" : "#9CA3AF"} textAnchor="middle">{centerLabel}</SvgText>
      {rings.map((ring) => (
        <SvgText key={ring.label} x={cx + ring.r + 8} y={cy + 4}
          fontSize="8.5" fill={isDark ? "rgba(255,255,255,0.35)" : "#9CA3AF"}
          textAnchor="start">{ring.label}</SvgText>
      ))}
    </Svg>
  );
}

// ─── O2: Semi-circle gauge with colored zones ─────────────────────────────────
function O2RangeColumns({ history, currentValue, isDark }: { history: number[]; currentValue: number; isDark: boolean }) {
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
  const textColor = isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const barColor = "#7C89FF";

  return (
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
  );
}

// ─── STEPS: Bar chart (14 days) + progress line overlay ──────────────────────
function StepsBars({ data, isDark }: { data: number[]; isDark: boolean }) {
  const W = screenWidth - 80;
  const H = 180;
  const pL = 10, pR = 10, pT = 16, pB = 28;
  const cW = W - pL - pR, cH = H - pT - pB;
  const bars = data.slice(0, 14).reverse();
  const maxVal = Math.max(...bars, 1);
  const bW = (cW / bars.length) * 0.52;
  const gW = (cW / bars.length) * 0.48;
  const trackColor = isDark ? "rgba(255,255,255,0.05)" : "#EFF6FF";
  const textColor = isDark ? "rgba(255,255,255,0.35)" : "#93C5FD";

  const pts = bars.map((v, i) => ({
    x: pL + i * (bW + gW) + bW / 2,
    y: pT + cH - (v / maxVal) * cH,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${pT + cH} L ${pts[0].x} ${pT + cH} Z`;

  return (
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
  );
}

// ─── TEMP: Thermometer with side tick labels ──────────────────────────────────
function Thermometer({ value, isDark }: { value: number; isDark: boolean }) {
  const W = 160, H = 230;
  const tubX = 40, tubW = 18;
  const bulbR = 15, bulbCY = H - 26;
  const tubeTop = 18, tubeBot = bulbCY - bulbR + 4;
  const tubeH = tubeBot - tubeTop;
  const min = 35, max = 40;
  const pct = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const fillH = tubeH * pct;
  const fillY = tubeBot - fillH;
  const fillColor = value <= 37.5 ? "#86EFAC" : value <= 38.5 ? "#FDE68A" : "#FCA5A5";
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
                fill={isDark ? "#FDE68A" : "#D97706"}>37.5°</SvgText>
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
        fill={isDark ? "rgba(255,255,255,0.45)" : "#9CA3AF"} textAnchor="middle">kcal</SvgText>
      <SvgText x={cx} y={cy + 26} fontSize="9"
        fill="#7C89FF" textAnchor="middle">{Math.round(pct * 100)}% meta</SvgText>
    </Svg>
  );
}

// ─── STRESS/HEART: EEG-style symmetric waveform bars ────────────────────────
function StressWave({ value, history, isDark, colorFn }: {
  value: number; history: number[]; isDark: boolean;
  colorFn?: (v: number) => string;
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
  );
}

// ─── Zone List ────────────────────────────────────────────────────────────────
function ZoneList({ zones, value, isDark }: {
  zones: { label: string; range: [number, number]; color: string; display: string }[];
  value: number; isDark: boolean;
}) {
  const ts = isDark ? "text-gray-400" : "text-gray-500";
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
  const config = METRIC_CONFIGS[resolvedType];
  const { isDark } = useTheme();

  const { data: metricData, isLoading } = useHealthMetric(config.endpoint);
  const { data: stats } = useMetricStats(config.endpoint);

  const currentRaw: number = metricData?.latest?.value ?? 0;
  const history: number[] = metricData?.history ?? [];
  const chartData = history.length >= 2 ? [...history].reverse() : [0, 0];
  const allTimeMin = stats?.min ?? (history.length ? Math.min(...history) : 0);
  const allTimeMax = stats?.max ?? (history.length ? Math.max(...history) : 0);

  const status = config.getStatus(currentRaw);
  const palette = STATUS_PALETTE[status];
  const extraCards = config.extraCards(history, stats ?? null, currentRaw);

  const cardBg = isDark ? "bg-aide-dark-card border-white/10" : "bg-white border-gray-100";
  const shadow = { boxShadow: "0 2px 12px 0 rgba(0,0,0,0.08)" } as any;
  const tp = isDark ? "text-white" : "text-black";
  const ts = isDark ? "text-gray-400" : "text-gray-500";
  const tAccent = config.accent;

  const HEART_ZONES: { label: string; range: [number, number]; color: string; display: string }[] = [
    { label: "Repouso",  range: [40, 60],   color: "#93C5FD", display: "40 – 60 bpm" },
    { label: "Normal",   range: [60, 100],  color: "#86EFAC", display: "60 – 100 bpm" },
    { label: "Elevado",  range: [100, 140], color: "#FDE68A", display: "100 – 140 bpm" },
    { label: "Máximo",   range: [140, 999], color: "#FCA5A5", display: "≥ 140 bpm" },
  ];
  const TEMP_ZONES: { label: string; range: [number, number]; color: string; display: string }[] = [
    { label: "Hipotermia",  range: [0, 36],    color: "#93C5FD", display: "< 36 ºC" },
    { label: "Normal",      range: [36, 37.5], color: "#86EFAC", display: "36 – 37.5 ºC" },
    { label: "Febre Baixa", range: [37.5, 38.5], color: "#FDE68A", display: "37.5 – 38.5 ºC" },
    { label: "Febre Alta",  range: [38.5, 999], color: "#FCA5A5", display: "≥ 38.5 ºC" },
  ];
  const O2_LEGEND = [
    { label: "Normal",  desc: "≥ 96%",  color: "#86EFAC" },
    { label: "Baixo",   desc: "94–95%", color: "#FDE68A" },
    { label: "Crítico", desc: "< 94%",  color: "#FCA5A5" },
  ];
  const STRESS_LEGEND = [
    { label: "Baixo",    desc: "< 40",  color: "#86EFAC" },
    { label: "Moderado", desc: "40–70", color: "#FDE68A" },
    { label: "Alto",     desc: "> 70",  color: "#FCA5A5" },
  ];

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
              <ScrollView className="flex-1" showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 48 }}>

                {/* ── Hero Value Card ────────────────────────────────────── */}
                <View className={`rounded-3xl p-6 border mb-5 ${cardBg}`} style={shadow}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      {/* Colored accent bar */}
                      <View className="w-10 h-1 rounded-full mb-3"
                        style={{ backgroundColor: config.accent }} />
                      <Text className="text-xs font-open-sans mb-1" style={{ color: tAccent }}>
                        {config.label}
                      </Text>
                      <View className="flex-row items-baseline mb-3">
                        <Text style={{
                          color: isDark ? "#FFFFFF" : "#111827",
                          fontSize: 68, lineHeight: 72, fontWeight: "800", letterSpacing: -2
                        }} className="font-open-sans">{config.formatValue(currentRaw)}</Text>
                        <Text className={`text-xl font-medium ml-2 ${ts}`}>{config.displayUnit}</Text>
                      </View>
                      <View className="self-start flex-row items-center gap-1.5 px-4 py-1.5 rounded-full"
                        style={{ backgroundColor: palette.bg, borderWidth: 1, borderColor: palette.border }}>
                        <Feather
                          name={status === "normal" ? "check-circle" : status === "warning" ? "alert-circle" : "alert-triangle"}
                          size={13} color={palette.text} />
                        <Text className="text-xs font-bold font-open-sans" style={{ color: palette.text }}>
                          {config.statusLabel(status)}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end gap-3 ml-4">
                      {resolvedType === "steps" ? (
                        <>
                          <View className="items-end">
                            <View className="flex-row items-baseline">
                              <Text className={`text-2xl font-bold font-open-sans ${tp}`}>{Math.round(calcAvg(history)).toLocaleString("pt-PT")}</Text>
                              <Text className={`text-xs ml-1 ${ts}`}>passos</Text>
                            </View>
                            <Text className="text-xs font-open-sans mt-0.5" style={{ color: tAccent }}>Média Diária</Text>
                          </View>
                          <View className={`w-10 h-[2px] ${isDark ? "bg-white/10" : "bg-gray-200"}`} />
                          <View className="items-end">
                            <View className="flex-row items-baseline">
                              <Text className={`text-2xl font-bold font-open-sans ${tp}`}>10 000</Text>
                              <Text className={`text-xs ml-1 ${ts}`}>passos</Text>
                            </View>
                            <Text className="text-xs font-open-sans mt-0.5" style={{ color: tAccent }}>Meta</Text>
                          </View>
                        </>
                      ) : (
                        <>
                          <View className="items-end">
                            <View className="flex-row items-baseline">
                              <Text className={`text-2xl font-bold font-open-sans ${tp}`}>{allTimeMax}</Text>
                              <Text className={`text-xs ml-1 ${ts}`}>{config.displayUnit}</Text>
                            </View>
                            <Text className="text-xs font-open-sans mt-0.5" style={{ color: tAccent }}>Máximo</Text>
                          </View>
                          <View className={`w-10 h-[2px] ${isDark ? "bg-white/10" : "bg-gray-200"}`} />
                          <View className="items-end">
                            <View className="flex-row items-baseline">
                              <Text className={`text-2xl font-bold font-open-sans ${tp}`}>{allTimeMin}</Text>
                              <Text className={`text-xs ml-1 ${ts}`}>{config.displayUnit}</Text>
                            </View>
                            <Text className="text-xs font-open-sans mt-0.5" style={{ color: tAccent }}>Mínimo</Text>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                </View>

                {/* ════ UNIQUE VISUALIZATIONS PER METRIC ════ */}

                {/* ── HEART: EEG waveform ───────────────────────────────── */}
                {resolvedType === "heart" && (
                  <View className={`rounded-3xl p-5 border mb-5 ${cardBg}`} style={shadow}>
                    <View className="flex-row items-center justify-between mb-4">
                      <Text className="text-base font-safiro" style={{ color: config.accent }}>
                        Perfil Cardíaco
                      </Text>
                      <View className="flex-row gap-4">
                        {[{color:"#86EFAC",label:"Normal"},{color:"#FDE68A",label:"Elevado"},{color:"#FCA5A5",label:"Crítico"}].map((r) => (
                          <View key={r.label} className="items-center gap-0.5">
                            <View className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                            <Text className="text-xs font-open-sans"
                              style={{ color: isDark ? "rgba(255,255,255,0.45)" : "#9CA3AF" }}>{r.label}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    <View className="items-center">
                      <StressWave value={currentRaw} history={history} isDark={isDark}
                        colorFn={(v) => v <= 60 ? "#93C5FD" : v <= 100 ? "#86EFAC" : v <= 140 ? "#FDE68A" : "#FCA5A5"} />
                    </View>
                    <View className="flex-row h-2 rounded-full overflow-hidden mt-4">
                      <View style={{ flex: 20, backgroundColor: "#93C5FD" }} />
                      <View style={{ flex: 40, backgroundColor: "#86EFAC" }} />
                      <View style={{ flex: 30, backgroundColor: "#FDE68A" }} />
                      <View style={{ flex: 10, backgroundColor: "#FCA5A5" }} />
                    </View>
                    <View className="flex-row justify-between mt-1">
                      {["40","60","100","140+"].map((v) => (
                        <Text key={v} className={`text-xs font-open-sans ${ts}`}>{v}</Text>
                      ))}
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
                      <Text className={`text-sm font-open-sans ${ts}`}>%</Text>
                    </View>
                    <O2RangeColumns history={history} currentValue={currentRaw} isDark={isDark} />
                    <View className="flex-row justify-center gap-8 mt-4">
                      {O2_LEGEND.map((r) => (
                        <View key={r.label} className="items-center gap-1">
                          <View className="w-8 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                          <Text className="text-xs font-open-sans" style={{ color: tAccent }}>{r.label}</Text>
                          <Text className={`text-xs font-open-sans ${ts}`}>{r.desc}</Text>
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
                    <View className="items-center">
                      <StepsBars data={history.length >= 2 ? history : [0, 0]} isDark={isDark} />
                    </View>
                    <View className="mt-4">
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-xs font-open-sans" style={{ color: tAccent }}>Progresso para a meta</Text>
                        <Text className="text-xs font-bold font-open-sans" style={{ color: config.accent }}>
                          {Math.min(Math.round(((history[0] ?? 0) / 10000) * 100), 100)}%
                        </Text>
                      </View>
                      <View className={`h-3 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-blue-50"}`}>
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
                      <View className="items-center justify-center">
                        <Thermometer value={currentRaw} isDark={isDark} />
                      </View>
                      <View className="flex-1 gap-3 pl-2">
                        <Text className="text-xs font-open-sans" style={{ color: tAccent }}>Referência</Text>
                        {TEMP_ZONES.map((z) => {
                          const active = currentRaw >= z.range[0] && currentRaw < z.range[1];
                          return (
                            <View key={z.label} className="flex-row items-center gap-2 py-1.5 px-2.5 rounded-xl"
                              style={active ? { backgroundColor: `${z.color}28`, borderWidth: 1, borderColor: z.color } : undefined}>
                              <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: z.color }} />
                              <View>
                                <Text className="text-xs font-open-sans"
                                  style={{ color: tAccent, fontWeight: active ? "700" : "400" }}>{z.label}</Text>
                                <Text className={`text-xs font-open-sans ${ts}`}>{z.display}</Text>
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
                    <View className="items-center">
                      <CalBurst value={currentRaw} isDark={isDark} />
                    </View>
                    <View className={`h-2 rounded-full mt-2 ${isDark ? "bg-white/10" : "bg-orange-50"}`}>
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
                        {[{color:"#86EFAC",label:"Baixo"},{color:"#FDE68A",label:"Moderado"},{color:"#FCA5A5",label:"Alto"}].map((z) => (
                          <View key={z.label} className="flex-row items-center gap-1">
                            <View className="w-2 h-2 rounded-full" style={{ backgroundColor: z.color }} />
                            <Text className="text-xs font-open-sans"
                              style={{ color: isDark ? "rgba(255,255,255,0.45)" : "#9CA3AF" }}>{z.label}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    <View className="items-center py-2">
                      <HeartTripleRings value={currentRaw} isDark={isDark} centerLabel="stress" />
                    </View>
                    <View className="rounded-2xl p-3 mt-1"
                      style={{ backgroundColor: isDark ? "rgba(255,255,255,0.04)" : config.accentLight }}>
                      <Text className="text-xs font-open-sans text-center"
                        style={{ color: isDark ? "rgba(255,255,255,0.45)" : "#6B7280" }}>
                        Cada anel representa uma zona de stress. O ponto luminoso indica a progressão na zona atual.
                      </Text>
                    </View>
                  </View>
                )}

                {/* ── History Line Chart ────────────────────────────────── */}
                {resolvedType === "heart" ? (
                  // Heart: Show average visualization
                  <View className={`rounded-3xl p-5 border mb-5 ${cardBg}`} style={shadow}>
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
                            <View className="rounded-xl p-3 flex-row items-center justify-between"
                              style={{ backgroundColor: isDark ? "rgba(252,165,165,0.1)" : "#FEF2F2" }}>
                              <View className="flex-row items-center gap-2">
                                <View className="w-8 h-8 rounded-full items-center justify-center"
                                  style={{ backgroundColor: "#FCA5A5" }}>
                                  <Feather name="trending-up" size={16} color="#991B1B" />
                                </View>
                                <Text className={`text-sm font-open-sans ${ts}`}>Média Alta</Text>
                              </View>
                              <Text className="text-lg font-bold font-safiro" style={{ color: "#EF4444" }}>
                                {avgHigh !== null ? Math.round(avgHigh) : "--"}
                              </Text>
                            </View>
                            
                            {/* Low */}
                            <View className="rounded-xl p-3 flex-row items-center justify-between"
                              style={{ backgroundColor: isDark ? "rgba(134,239,172,0.1)" : "#F0FDF4" }}>
                              <View className="flex-row items-center gap-2">
                                <View className="w-8 h-8 rounded-full items-center justify-center"
                                  style={{ backgroundColor: "#86EFAC" }}>
                                  <Feather name="trending-down" size={16} color="#166534" />
                                </View>
                                <Text className={`text-sm font-open-sans ${ts}`}>Média Baixa</Text>
                              </View>
                              <Text className="text-lg font-bold font-safiro" style={{ color: "#22C55E" }}>
                                {avgLow !== null ? Math.round(avgLow) : "--"}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })()}
                  </View>
                ) : resolvedType !== "o2" ? (
                  <View className={`rounded-3xl p-5 border mb-5 ${cardBg}`} style={shadow}>
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
                      style={[shadow, { minWidth: (screenWidth - 56) / 2 - 6, flex: 1 }]}>
                      <View className="flex-row items-center gap-2 mb-2">
                        <View className="w-7 h-7 rounded-lg items-center justify-center"
                          style={{ backgroundColor: `${config.accent}20` }}>
                          <Feather name={card.icon as any} size={14} color={config.accent} />
                        </View>
                        <Text className="text-xs font-open-sans" style={{ color: tAccent }}>{card.label}</Text>
                      </View>
                      <View className="flex-row items-baseline">
                        <Text className={`text-2xl font-bold font-safiro ${tp}`}>{card.value}</Text>
                        {card.unit ? <Text className={`text-xs ml-1 ${ts}`}>{card.unit}</Text> : null}
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

