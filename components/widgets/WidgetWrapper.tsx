import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@expo/vector-icons";
import React, { ReactNode } from "react";
import { Dimensions, Text, View, ViewStyle } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { IconType } from "../svg/WidgetIcon";

const { width: screenWidth } = Dimensions.get("window");
const GRID_PADDING = 16;
const GRID_GAP = 12;
const availableWidth = screenWidth - GRID_PADDING * 2;
const COLUMN_WIDTH = (availableWidth - GRID_GAP * 2) / 3;
const BRAND_BLUE = "#7C89FF";
const DEFAULT_SEMANTIC = {
  success: "#4CD964",
  warning: "#FFCC00",
  danger: "#FF5151",
};

export type WidgetVariant = "1-1" | "1-2" | "1-3" | "2-3";

//  Smooth curve helper
function smoothPath(pts: { x: number; y: number }[], t = 0.35): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    d += ` C ${p0.x + (p1.x - p0.x) * t} ${p0.y}, ${p1.x - (p1.x - p0.x) * t} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

//  1. Heart  coloured zone bands + line
function HeartMiniChart({
  data,
  w,
  h,
  isDark,
  semantic = DEFAULT_SEMANTIC,
}: {
  data: number[];
  w: number;
  h: number;
  isDark: boolean;
  semantic?: { success: string; warning: string; danger: string };
}) {
  const pts = data.slice(-16);
  if (pts.length < 2) return null;
  const mn = 40;
  const mx = 160;
  const pad = { l: 0, r: 0, t: 2, b: 0 };
  const toX = (i: number) =>
    pad.l + (i / (pts.length - 1)) * (w - pad.l - pad.r);
  const toY = (v: number) =>
    pad.t + (1 - (v - mn) / (mx - mn)) * (h - pad.t - pad.b);
  const zones = [
    { lo: 40, hi: 60, color: "#93C5FD" },
    { lo: 60, hi: 100, color: semantic.success },
    { lo: 100, hi: 140, color: semantic.warning },
    { lo: 140, hi: 160, color: semantic.danger },
  ];
  const linePath = smoothPath(pts.map((v, i) => ({ x: toX(i), y: toY(v) })));
  const fillPath =
    linePath + ` L ${toX(pts.length - 1)} ${h} L ${toX(0)} ${h} Z`;
  const gId = "hmc";
  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={BRAND_BLUE} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={BRAND_BLUE} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {zones.map((z) => {
        const y1 = toY(Math.min(z.hi, mx));
        const y2 = toY(Math.max(z.lo, mn));
        if (y2 <= y1) return null;
        return (
          <Rect
            key={z.lo}
            x={pad.l}
            y={y1}
            width={w - pad.l - pad.r}
            height={y2 - y1}
            fill={z.color}
            opacity={isDark ? 0.12 : 0.22}
          />
        );
      })}
      <Path d={fillPath} fill={`url(#${gId})`} />
      <Path
        d={linePath}
        fill="none"
        stroke={BRAND_BLUE}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={toX(pts.length - 1)}
        cy={toY(pts[pts.length - 1])}
        r={3}
        fill={BRAND_BLUE}
      />
    </Svg>
  );
}

//  2. Stress/Heart — triple concentric zone rings (mirrors HeartTripleRings in MasterDetail)
function StressMiniChart({
  value,
  history,
  w,
  h,
  isDark,
  semantic = DEFAULT_SEMANTIC,
}: {
  value: number;
  history: number[];
  w: number;
  h: number;
  isDark: boolean;
  semantic?: { success: string; warning: string; danger: string };
}) {
  const size = Math.min(w, h);
  const cx = size / 2;
  const cy = size / 2;
  const trackColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.14)";
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  // Zone rings matching the stress master detail (Baixo/Moderado/Alto zones)
  const scale = size / 220;
  const rings = [
    { r: 46 * scale, min: 0, max: 40, color: semantic.success, label: "Baixo" },
    {
      r: 66 * scale,
      min: 40,
      max: 70,
      color: semantic.warning,
      label: "Moderado",
    },
    { r: 86 * scale, min: 70, max: 100, color: semantic.danger, label: "Alto" },
  ];
  const ringPct = (min: number, max: number) => {
    if (value <= min) return 0;
    if (value >= max) return 1;
    return (value - min) / (max - min);
  };
  const sw = Math.max(size * 0.038, 3);
  const inactiveStroke = isDark ? sw : sw * 1.12;
  const activeStroke = isDark ? sw * 1.25 : sw * 1.45;
  return (
    <Svg width={size} height={size}>
      <Defs>
        {rings.map((ring, i) => (
          <LinearGradient key={i} id={`srg${i}`} x1="0" y1="0" x2="1" y2="0">
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
                stroke={`url(#srg${i})`}
                strokeWidth={isActive ? activeStroke : inactiveStroke}
                strokeLinecap="round"
                strokeDasharray={`${circ * pct} ${circ}`}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            )}
            {isActive && pct > 0 && (
              <>
                <Circle cx={dotX} cy={dotY} r={sw * 0.85} fill={ring.color} />
                <Circle cx={dotX} cy={dotY} r={sw * 0.42} fill="white" />
              </>
            )}
          </G>
        );
      })}
      {/* Centre value */}
      <SvgText
        x={cx}
        y={cy + size * 0.1}
        fontSize={size * 0.25}
        fontWeight="700"
        fill={isDark ? "#FFF" : "#111827"}
        textAnchor="middle"
      >
        {Math.round(value)}
      </SvgText>
    </Svg>
  );
}

//  3. Steps  vertical bar chart with goal line
function StepsMiniChart({
  currentSteps,
  goal = 10000,
  w,
  h,
  isDark,
  semantic = DEFAULT_SEMANTIC,
}: {
  currentSteps: number;
  goal?: number;
  w: number;
  h: number;
  isDark: boolean;
  semantic?: { success: string; warning: string; danger: string };
}) {
  const safeGoal = Math.max(goal, 1);
  const progressPct = Math.min(Math.max(currentSteps / safeGoal, 0), 1);
  const milestones = [0.25, 0.5];

  const padX = 6;
  const trackH = Math.min(Math.max(Math.round(h * 0.24), 10), 16);
  const trackY = Math.round((h - trackH) / 2);
  const trackW = Math.max(w - padX * 2, 10);
  const fillW = Math.max(trackW * progressPct, 0);
  const trackColor = isDark ? "rgba(255,255,255,0.14)" : "#E2E8F0";

  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id="stepsProgressFill" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor={BRAND_BLUE} stopOpacity="0.95" />
          <Stop offset="100%" stopColor={semantic.success} stopOpacity="0.95" />
        </LinearGradient>
      </Defs>

      <Rect
        x={padX}
        y={trackY}
        width={trackW}
        height={trackH}
        rx={trackH / 2}
        fill={trackColor}
      />

      {fillW > 0 && (
        <Rect
          x={padX}
          y={trackY}
          width={fillW}
          height={trackH}
          rx={trackH / 2}
          fill="url(#stepsProgressFill)"
        />
      )}

      {milestones.map((milestone) => {
        const x = padX + trackW * milestone;
        const reached = progressPct >= milestone;
        const markerRadius = 7;
        const markerFill = reached
          ? semantic.success
          : isDark
            ? "rgba(255,255,255,0.26)"
            : "#CBD5E1";

        return (
          <G key={milestone}>
            <Circle
              cx={x}
              cy={trackY + trackH / 2}
              r={markerRadius}
              fill={markerFill}
            />

            {reached ? (
              <>
                <Line
                  x1={x - 3}
                  y1={trackY + trackH / 2}
                  x2={x - 1}
                  y2={trackY + trackH / 2 + 2.5}
                  stroke="#ffffff"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <Line
                  x1={x - 1}
                  y1={trackY + trackH / 2 + 2.5}
                  x2={x + 3.5}
                  y2={trackY + trackH / 2 - 2.5}
                  stroke="#ffffff"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <Circle
                cx={x}
                cy={trackY + trackH / 2}
                r={2}
                fill={isDark ? "#0f172a" : "#ffffff"}
                opacity={0.5}
              />
            )}

            <SvgText
              x={x}
              y={trackY - 4}
              fontSize="8"
              fontWeight="700"
              fill={isDark ? "rgba(255,255,255,0.7)" : "#64748B"}
              textAnchor="middle"
            >
              {`${Math.round(milestone * 100)}%`}
            </SvgText>
          </G>
        );
      })}

      <SvgText
        x={padX + trackW}
        y={trackY + trackH + 12}
        fontSize="8"
        fontWeight="700"
        fill={isDark ? "rgba(255,255,255,0.7)" : "#64748B"}
        textAnchor="end"
      >
        {`${Math.round(progressPct * 100)}%`}
      </SvgText>
    </Svg>
  );
}

//  4. Temp — SVG thermometer (used in 1–1)
function TempMiniChart({
  value,
  w,
  h,
  isDark,
  semantic = DEFAULT_SEMANTIC,
}: {
  value: number;
  w: number;
  h: number;
  isDark: boolean;
  semantic?: { success: string; warning: string; danger: string };
}) {
  const tubeW = Math.max(Math.min(w * 0.22, 14), 7);
  const bulbR = Math.max(tubeW * 1.1, 7);
  const tubeX = w / 2;
  const tubeTop = 6;
  const tubeBot = h - bulbR * 2 - 6;
  const tubeH = Math.max(tubeBot - tubeTop, 10);
  const tMin = 35;
  const tMax = 40;
  const clamp = Math.min(Math.max(value || 36.5, tMin), tMax);
  const fillPct = (clamp - tMin) / (tMax - tMin);
  const fillH = fillPct * tubeH;
  const fillY = tubeBot - fillH;
  const fillColor =
    value > 38.5
      ? semantic.danger
      : value > 37.5
        ? semantic.warning
        : value >= 36
          ? semantic.success
          : "#60A5FA";
  const track = isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB";
  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id="tmFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={fillColor} stopOpacity="0.9" />
          <Stop offset="100%" stopColor={fillColor} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Rect
        x={tubeX - tubeW / 2}
        y={tubeTop}
        width={tubeW}
        height={tubeH}
        rx={tubeW / 2}
        fill={track}
      />
      {fillH > 0 && (
        <Rect
          x={tubeX - tubeW / 2}
          y={fillY}
          width={tubeW}
          height={fillH + bulbR}
          rx={fillH > tubeH * 0.95 ? tubeW / 2 : 2}
          fill="url(#tmFill)"
        />
      )}
      <Circle cx={tubeX} cy={tubeBot + bulbR} r={bulbR} fill={fillColor} />
      <Circle
        cx={tubeX}
        cy={tubeBot + bulbR}
        r={bulbR - 3}
        fill={fillColor}
        opacity={0.5}
      />
    </Svg>
  );
}

//  4b. Temp — line/area chart (used in 1–2 / 1–3)
function TempLineMiniChart({
  data,
  value,
  w,
  h,
  isDark,
  semantic = DEFAULT_SEMANTIC,
}: {
  data: number[];
  value: number;
  w: number;
  h: number;
  isDark: boolean;
  semantic?: { success: string; warning: string; danger: string };
}) {
  const pts = data.slice(-16);
  if (pts.length < 2) return null;
  const mn = 35;
  const mx = 40;
  const pad = { l: 0, r: 0, t: 3, b: 3 };
  const toX = (i: number) =>
    pad.l + (i / (pts.length - 1)) * (w - pad.l - pad.r);
  const toY = (v: number) =>
    pad.t +
    (1 - (Math.min(Math.max(v, mn), mx) - mn) / (mx - mn)) *
      (h - pad.t - pad.b);
  const linePath = smoothPath(pts.map((v, i) => ({ x: toX(i), y: toY(v) })));
  const fillPath =
    linePath + ` L ${toX(pts.length - 1)} ${h} L ${toX(0)} ${h} Z`;
  const lineColor =
    value > 38.5
      ? semantic.danger
      : value > 37.5
        ? semantic.warning
        : value >= 36
          ? semantic.success
          : "#60A5FA";
  const gId = "tmp";
  // Normal range band 36–37.5
  const normalTop = toY(37.5);
  const normalBot = toY(36.0);
  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={lineColor} stopOpacity="0.35" />
          <Stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
        </LinearGradient>
      </Defs>
      {/* Normal zone band */}
      <Rect
        x={0}
        y={normalTop}
        width={w}
        height={Math.max(normalBot - normalTop, 0)}
        fill={semantic.success}
        opacity={0.1}
      />
      <Path d={fillPath} fill={`url(#${gId})`} />
      <Path
        d={linePath}
        fill="none"
        stroke={lineColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={toX(pts.length - 1)}
        cy={toY(pts[pts.length - 1])}
        r={3}
        fill={lineColor}
      />
    </Svg>
  );
}

//  5. O2  arc gauge
function O2MiniChart({
  value,
  w,
  h,
  isDark,
  semantic = DEFAULT_SEMANTIC,
}: {
  value: number;
  w: number;
  h: number;
  isDark: boolean;
  semantic?: { success: string; warning: string; danger: string };
}) {
  const size = Math.min(w, h * 1.6);
  const r = size * 0.37;
  const cx = w / 2;
  const cy = h * 0.72;
  const startA = -210;
  const sweepA = 240;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const pct = Math.min(Math.max((value - 88) / 12, 0), 1);
  const curA = startA + sweepA * pct;
  const arcPath = (s: number, e: number) => {
    const sr = toRad(s);
    const er = toRad(e);
    const large = e - s > 180 ? 1 : 0;
    return `M ${cx + r * Math.cos(sr)} ${cy + r * Math.sin(sr)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(er)} ${cy + r * Math.sin(er)}`;
  };
  const zones = [
    { from: startA, to: startA + sweepA * 0.5, color: semantic.danger },
    {
      from: startA + sweepA * 0.5,
      to: startA + sweepA * 0.667,
      color: semantic.warning,
    },
    {
      from: startA + sweepA * 0.667,
      to: startA + sweepA,
      color: semantic.success,
    },
  ];
  const fillColor =
    value >= 96
      ? semantic.success
      : value >= 94
        ? semantic.warning
        : semantic.danger;
  const track = isDark ? "rgba(255,255,255,0.07)" : "#E5E7EB";
  const dotX = cx + r * Math.cos(toRad(curA));
  const dotY = cy + r * Math.sin(toRad(curA));
  const gId = "o2m";
  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id={gId} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor={fillColor} stopOpacity="0.5" />
          <Stop offset="100%" stopColor={fillColor} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Path
        d={arcPath(startA, startA + sweepA)}
        fill="none"
        stroke={track}
        strokeWidth={r * 0.16}
        strokeLinecap="round"
      />
      {zones.map((z, i) => (
        <Path
          key={i}
          d={arcPath(z.from, z.to)}
          fill="none"
          stroke={z.color}
          strokeWidth={r * 0.065}
          strokeLinecap="butt"
          opacity={0.7}
        />
      ))}
      {pct > 0 && (
        <Path
          d={arcPath(startA, curA)}
          fill="none"
          stroke={`url(#${gId})`}
          strokeWidth={r * 0.16}
          strokeLinecap="round"
        />
      )}
      <Circle cx={dotX} cy={dotY} r={r * 0.09} fill={fillColor} />
      <Circle cx={dotX} cy={dotY} r={r * 0.045} fill="white" />
    </Svg>
  );
}

// 6. Sleep - Bar chart of hours
function SleepMiniChart({
  data,
  w,
  h,
  isDark,
}: {
  data: number[];
  w: number;
  h: number;
  isDark: boolean;
}) {
  const bars = data.slice(-7).reverse(); // Last 7 nights
  if (!bars.length) return null;
  const max = 12; // 12 hours max scale
  const gap = 4;
  const barW = Math.max(
    Math.floor((w - (bars.length - 1) * gap) / bars.length),
    4,
  );
  const toH = (v: number) => (Math.min(v, max) / max) * h;
  const color = (v: number) =>
    v >= 7 && v <= 9 ? "#6366F1" : v < 7 ? "#F59E0B" : "#818CF8";

  return (
    <Svg width={w} height={h}>
      {bars.map((v, i) => {
        const bh = toH(v);
        const x = i * (barW + gap);
        // Rounded top bars
        return (
          <Rect
            key={i}
            x={x}
            y={h - bh}
            width={barW}
            height={bh}
            rx={barW / 2}
            fill={color(v)}
            opacity={0.8}
          />
        );
      })}
      {/* 8h goal line */}
      <Line
        x1={0}
        y1={h * (1 - 8 / 12)}
        x2={w}
        y2={h * (1 - 8 / 12)}
        stroke={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"}
        strokeDasharray="4,4"
        strokeWidth="1"
      />
    </Svg>
  );
}

// 7. Glycemia - Line chart with zones
function GlycemiaMiniChart({
  data,
  w,
  h,
  isDark,
  semantic = DEFAULT_SEMANTIC,
}: {
  data: number[];
  w: number;
  h: number;
  isDark: boolean;
  semantic?: { success: string; warning: string; danger: string };
}) {
  const pts = data.slice(-16);
  if (pts.length < 2) return null;
  const mn = 50;
  const mx = 200;
  const pad = { l: 0, r: 0, t: 2, b: 0 };
  const toX = (i: number) =>
    pad.l + (i / (pts.length - 1)) * (w - pad.l - pad.r);
  const toY = (v: number) =>
    pad.t +
    (1 - (Math.min(Math.max(v, mn), mx) - mn) / (mx - mn)) *
      (h - pad.t - pad.b);

  const linePath = smoothPath(pts.map((v, i) => ({ x: toX(i), y: toY(v) })));
  const fillPath =
    linePath + ` L ${toX(pts.length - 1)} ${h} L ${toX(0)} ${h} Z`;
  const gId = "glc";

  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#EC4899" stopOpacity="0.3" />
          <Stop offset="100%" stopColor="#EC4899" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {/* Zones */}
      <Rect
        x={0}
        y={toY(140)}
        width={w}
        height={toY(70) - toY(140)}
        fill={semantic.success}
        opacity={0.1}
      />

      <Path d={fillPath} fill={`url(#${gId})`} />
      <Path
        d={linePath}
        fill="none"
        stroke="#EC4899"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={toX(pts.length - 1)}
        cy={toY(pts[pts.length - 1])}
        r={3}
        fill="#EC4899"
      />
    </Svg>
  );
}

// 8. BP - Area chart (Simulated range since we only have average)
function BPMiniChart({
  data,
  w,
  h,
  isDark,
}: {
  data: number[];
  w: number;
  h: number;
  isDark: boolean;
}) {
  // data is roughly (sys+dia)/2.
  // We can just plot this trend line, maybe slightly thicker or different style
  const pts = data.slice(-16);
  if (pts.length < 2) return null;
  const mn = 60;
  const mx = 140; // Avg BP range
  const pad = { l: 0, r: 0, t: 2, b: 0 };
  const toX = (i: number) =>
    pad.l + (i / (pts.length - 1)) * (w - pad.l - pad.r);
  const toY = (v: number) =>
    pad.t +
    (1 - (Math.min(Math.max(v, mn), mx) - mn) / (mx - mn)) *
      (h - pad.t - pad.b);

  const linePath = smoothPath(pts.map((v, i) => ({ x: toX(i), y: toY(v) })));
  const fillPath =
    linePath + ` L ${toX(pts.length - 1)} ${h} L ${toX(0)} ${h} Z`;
  const gId = "bp";

  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
          <Stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </LinearGradient>
      </Defs>

      <Path d={fillPath} fill={`url(#${gId})`} />
      <Path
        d={linePath}
        fill="none"
        stroke="#8B5CF6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

//  Status helper
type MetricStatus = "normal" | "warning" | "alert";

function buildStatusPalette(
  semantic: { success: string; warning: string; danger: string },
  isDark: boolean,
): Record<MetricStatus, { bg: string; text: string; border: string }> {
  return {
    normal: {
      bg: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.88)",
      text: semantic.success,
      border: semantic.success,
    },
    warning: {
      bg: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.88)",
      text: semantic.warning,
      border: semantic.warning,
    },
    alert: {
      bg: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.88)",
      text: semantic.danger,
      border: semantic.danger,
    },
  };
}

function getStatus(
  type: IconType,
  valueStr: string,
): { text: string; status: MetricStatus } {
  const v = parseFloat(valueStr);
  if (isNaN(v)) return { text: "normal", status: "normal" };
  switch (type) {
    case "heartRate":
      return v > 100
        ? { text: "exercício", status: "warning" }
        : { text: "normal", status: "normal" };
    case "temp":
      return v > 37.5
        ? { text: "febre", status: "warning" }
        : { text: "normal", status: "normal" };
    case "stress":
      return v < 40
        ? { text: "baixo", status: "normal" }
        : v <= 70
          ? { text: "moderado", status: "warning" }
          : { text: "alto", status: "alert" };
    case "o2":
      return v >= 96
        ? { text: "normal", status: "normal" }
        : v >= 94
          ? { text: "baixo", status: "warning" }
          : { text: "critico", status: "alert" };
    default:
      return { text: "normal", status: "normal" };
  }
}

//  DASHBOARD_CONFIG / METRIC_STYLES
interface DASHBOARD_CONFIGProps {
  id: string;
  type: IconType;
  variant: WidgetVariant;
  value: string;
  feedback: string;
  endpoint: string;
}
export const DASHBOARD_CONFIG: DASHBOARD_CONFIGProps[] = [
  {
    id: "heart",
    type: "heartRate",
    variant: "1-2",
    value: "73",
    feedback: "normal",
    endpoint: "bpm",
  },
  {
    id: "steps",
    type: "steps",
    variant: "1-2",
    value: "10.432",
    feedback: "meta",
    endpoint: "steps",
  },
  {
    id: "blood Pressure",
    type: "bloodPressure",
    variant: "1-3",
    value: "10.432",
    feedback: "meta",
    endpoint: "bloodPressure",
  },
  {
    id: "temp",
    type: "temp",
    variant: "1-2",
    value: "36.6",
    feedback: "estável",
    endpoint: "temperature",
  },
  {
    id: "sleep",
    type: "sleep",
    variant: "1-3",
    value: "7",
    feedback: "bom",
    endpoint: "sleep",
  },
  {
    id: "o2",
    type: "o2",
    variant: "1-2",
    value: "98",
    feedback: "normal",
    endpoint: "o2",
  },
  {
    id: "cal",
    type: "cal",
    variant: "1-2",
    value: "450",
    feedback: "meta",
    endpoint: "cal",
  },
  {
    id: "stress",
    type: "stress",
    variant: "1-2",
    value: "3",
    feedback: "baixo",
    endpoint: "stress",
  },
];

export const METRIC_STYLES: Record<
  IconType,
  { title: string; unit: string; color: string; feedbackColor: string }
> = {
  heartRate: {
    title: "BPM",
    unit: "bpm",
    color: "#EF4444",
    feedbackColor: "#FACC15",
  },
  steps: {
    title: "Passos",
    unit: "",
    color: "#3B82F6",
    feedbackColor: "#10B981",
  },
  temp: {
    title: "Temp",
    unit: "ºC",
    color: "#F59E0B",
    feedbackColor: "#FDE68A",
  },
  sleep: {
    title: "Sono",
    unit: "h",
    color: "#6366F1",
    feedbackColor: "#C7D2FE",
  },
  o2: { title: "O", unit: "%", color: "#06B6D4", feedbackColor: "#A5F3FC" },
  bloodPressure: {
    title: "BP",
    unit: "mmHg",
    color: "#EC4899",
    feedbackColor: "#FBCFE8",
  },
  cal: {
    title: "Cal",
    unit: "kcal",
    color: "#F97316",
    feedbackColor: "#FED7AA",
  },
  stress: {
    title: "Stress",
    unit: "",
    color: "#64748B",
    feedbackColor: "#CBD5E1",
  },
  glucose: {
    title: "Glicose",
    unit: "mg/dL",
    color: "#EC4899",
    feedbackColor: "#FCE7F3",
  },
};

export interface DashboardItem {
  id: string;
  type: IconType;
  variant: WidgetVariant;
}

//  WidgetWrapper props
interface WidgetWrapperProps {
  title: string;
  variant: WidgetVariant;
  children?: React.ReactNode;
  bg?: string;
  style?: ViewStyle;
  icon: ReactNode;
  unit: string;
  feedback: string;
  feedbackColor: string;
  value: string;
  history?: number[];
  color?: string;
  metricType?: IconType;
  // legacy (unused but kept so nothing breaks)
  yMin?: number;
  yMax?: number;
  segments?: number;
  sparklineHeight?: number;
  valueOffsetBottom?: number;
}

//  WidgetWrapper
export function WidgetWrapper({
  title,
  icon,
  variant,
  feedback,
  unit,
  value,
  bg,
  style,
  history = [],
  metricType,
}: WidgetWrapperProps) {
  const { isDark, colors } = useTheme();

  const u1 = COLUMN_WIDTH;
  const u2 = u1 * 2 + GRID_GAP;
  const u3 = u1 * 3 + GRID_GAP * 2;
  const getDims = () => {
    switch (variant) {
      case "1-1":
        return { width: u1, height: u1 };
      case "1-2":
        return { width: u2, height: u1 };
      case "1-3":
        return { width: u3, height: u1 };
      case "2-3":
        return { width: u3, height: u2 };
      default:
        return { width: u1, height: u1 };
    }
  };
  const { width, height } = getDims();
  const is11 = variant === "1-1";
  const is12 = variant === "1-2";
  const is13 = variant === "1-3";

  const bgColor = bg || (isDark ? "bg-aide-dark-card" : "bg-white/90");
  const borderColor = isDark ? "border-white/10" : "border-gray-100";
  const textColor = isDark ? "#FFFFFF" : "#000746";

  const statusPalette = buildStatusPalette(colors.semantic, isDark);
  const status = metricType
    ? getStatus(metricType, value)
    : { text: feedback, status: "normal" as MetricStatus };
  const palette = statusPalette[status.status];

  //  Chart dimensions per size
  // For 1-1: chart replaces bottom half. For 1-2/1-3: chart in the right side pocket.
  const chartAreaHeight = height - 44; // below header
  const CHART_HEIGHT = Math.max(chartAreaHeight - 4, 20);

  // Horizontal space for chart in wide variants
  let valueAreaWidth = is11 ? width : is12 ? width * 0.42 : width * 0.38;
  let chartWidth = width - valueAreaWidth - (is11 ? 0 : 8);

  //  Render per-metric chart
  const renderChart = () => {
    if (!history || history.length < 2) return null;
    let cw = is11 ? width : chartWidth;
    let ch = is11 ? Math.round(height * 0.42) : CHART_HEIGHT;
    if (metricType === "stress") {
      ch = is11 ? height - 44 : height - 4; // Full height minus padding
      cw = is11 ? width - 16 : chartWidth;
    }

    switch (metricType) {
      case "heartRate":
        return (
          <HeartMiniChart
            data={history}
            w={cw}
            h={ch}
            isDark={isDark}
            semantic={colors.semantic}
          />
        );
      case "stress":
        return (
          <StressMiniChart
            value={parseFloat(value) || 0}
            history={history}
            w={cw}
            h={ch}
            isDark={isDark}
            semantic={colors.semantic}
          />
        );
      case "steps":
        return (
          <StepsMiniChart
            currentSteps={parseFloat(value) || 0}
            goal={10000}
            w={cw}
            h={ch}
            isDark={isDark}
            semantic={colors.semantic}
          />
        );
      case "temp":
        return (
          <TempLineMiniChart
            data={history}
            value={parseFloat(value) || 36.5}
            w={cw}
            h={ch}
            isDark={isDark}
            semantic={colors.semantic}
          />
        );
      case "o2":
        return (
          <O2MiniChart
            value={parseFloat(value) || 98}
            w={cw}
            h={ch}
            isDark={isDark}
            semantic={colors.semantic}
          />
        );
      case "sleep":
        return <SleepMiniChart data={history} w={cw} h={ch} isDark={isDark} />;
      case "cal":
      case "glucose":
        return (
          <GlycemiaMiniChart
            data={history}
            w={cw}
            h={ch}
            isDark={isDark}
            semantic={colors.semantic}
          />
        );
      case "bloodPressure":
        return <BPMiniChart data={history} w={cw} h={ch} isDark={isDark} />;
      default:
        return null;
    }
  };

  const chart = renderChart();

  //  1-1 layout: stacked (value on top, chart bottom)
  if (is11) {
    // Temp gets the same side-by-side treatment so the thermometer icon is visible
    if (metricType === "temp") {
      const tempVal = parseFloat(value) || 36.5;
      const thermW = Math.round(width * 0.28);
      const chartH = Math.max(height - 44, 20);
      return (
        <View
          style={[
            { width, height, boxShadow: "0 2px 8px 0 rgba(0,0,0,0.12)" },
            style,
          ]}
          className={`${bgColor} rounded-[20px] p-2 border ${borderColor} overflow-hidden flex-row`}
        >
          {/* Left: header + value + thermometer */}
          <View
            style={{ width: thermW + 4, paddingRight: 2 }}
            className="justify-between"
          >
            <View className="flex-row items-center gap-1">
              {icon}
              <Text
                className="text-xs font-open-sans-semibold"
                numberOfLines={1}
              >
                {title}
              </Text>
            </View>
            <View className="flex-row items-end">
              <Text
                style={{ color: textColor }}
                className="text-xl font-bold leading-none"
              >
                {value}
              </Text>
              <Text
                className={`text-xs font-semibold ml-0.5 mb-0.5 ${isDark ? "text-white/50" : "text-black/90"}`}
              >
                {unit}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TempMiniChart
                value={tempVal}
                w={thermW - 2}
                h={chartH - 8}
                isDark={isDark}
                semantic={colors.semantic}
              />
            </View>
          </View>
          {/* Right: line chart */}
          {chart && (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {chart}
            </View>
          )}
        </View>
      );
    }
    return (
      <View
        style={[
          { width, height, boxShadow: "0 2px 8px 0 rgba(0,0,0,0.12)" },
          style,
        ]}
        className={`${bgColor} rounded-[20px] p-2 border ${borderColor} overflow-hidden`}
      >
        {/* Header */}
        <View className="flex-row items-center gap-1 mb-1">
          {icon}
          <Text className="text-aide-light-blue text-sm font-open-sans-semibold tracking-wide">
            {title}
          </Text>
        </View>
        {/* Value - show custom steps indicator, otherwise show regular value */}
        {(!metricType || metricType !== "stress") && (
          <View className="flex-row items-end mb-1">
            {metricType === "steps" ? (
              <View className="-mt-2">
                <Text
                  style={{ color: textColor, lineHeight: 28 }}
                  className="text-2xl font-bold"
                >
                  {value}
                </Text>
                <Text
                  className={`text-xs font-semibold ${isDark ? "text-white/50" : "text-black/90"}`}
                >
                  /10000
                </Text>
              </View>
            ) : (
              <>
                <Text
                  style={{ color: textColor }}
                  className="text-2xl font-bold leading-none"
                >
                  {value}
                </Text>
                <Text
                  className={`text-xs font-semibold ml-1 mb-0.5 ${isDark ? "text-white/50" : "text-black/90"}`}
                >
                  {unit}
                </Text>
              </>
            )}
          </View>
        )}
        {/* Chart */}
        {chart && (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: metricType === "stress" ? "center" : "flex-end",
            }}
          >
            {chart}
          </View>
        )}
      </View>
    );
  }

  //  1-2 / 1-3 / 2-3 layout: value left, chart right
  // For temp: also render a small inline thermometer beside the value
  const tempVal = metricType === "temp" ? parseFloat(value) || 36.5 : 0;
  const showInlineTherm = metricType === "temp";
  const thermInlineW = 18;
  const effectiveValueWidth = showInlineTherm
    ? valueAreaWidth + thermInlineW + 4
    : valueAreaWidth;

  return (
    <View
      style={[
        { width, height, boxShadow: "0 2px 8px 0 rgba(0,0,0,0.12)" },
        style,
      ]}
      className={`${bgColor} rounded-[20px] p-2 border ${borderColor} overflow-hidden flex-row`}
    >
      {/* Left: header + value + badge [+ thermometer for temp] */}
      <View
        style={{ width: effectiveValueWidth, paddingRight: 4 }}
        className={
          metricType === "steps" ? "justify-center" : "justify-between"
        }
      >
        {/* Header */}
        <View className="flex-row items-center gap-1">
          {icon}
          <Text
            className="text-aide-light-blue text-base font-open-sans-semibold tracking-wide"
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        {/* Value row — for temp, inline thermometer sits to the right of the number */}
        <View style={{ flex: 1, justifyContent: "center" }}>
          {(metricType !== "stress" || is11) && (
            <View className="flex-row items-center">
              <View className="flex-row items-end" style={{ flex: 1 }}>
                {metricType === "steps" ? (
                  <View>
                    <Text
                      style={{ color: textColor, lineHeight: 28 }}
                      className="text-2xl font-bold"
                    >
                      {value}
                    </Text>
                    <Text
                      className={`text-xs font-semibold ${isDark ? "text-white/50" : "text-black/90"}`}
                    >
                      /10000
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text
                      style={{ color: textColor, fontSize: is13 ? 28 : 24 }}
                      className="font-bold leading-none"
                    >
                      {value}
                    </Text>
                    <Text
                      className={`text-xs font-semibold ml-1 mb-0.5 ${isDark ? "text-white/50" : "text-black/90"}`}
                    >
                      {unit}
                    </Text>
                  </>
                )}
              </View>
              {showInlineTherm && (
                <TempMiniChart
                  value={tempVal}
                  w={thermInlineW}
                  h={Math.max(CHART_HEIGHT - 10, 24)}
                  isDark={isDark}
                />
              )}
            </View>
          )}
        </View>
        {/* Status badge - only show for non-steps metrics */}
        {metricType !== "stress" && metricType !== "steps" && (
          <View
            className="self-start flex-row items-center gap-1.5 px-2 py-0.5 rounded-full mb-1"
            style={{
              backgroundColor: palette.bg,
              borderWidth: 1,
              borderColor: palette.border,
            }}
          >
            <Feather
              name={
                status.status === "normal"
                  ? "check-circle"
                  : status.status === "warning"
                    ? "alert-circle"
                    : "alert-triangle"
              }
              size={10}
              color={palette.text}
            />
            <Text
              className="text-[10px] font-bold font-open-sans"
              style={{ color: palette.text }}
            >
              {status.text}
            </Text>
          </View>
        )}
      </View>
      {/* Right: chart */}
      {chart && (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingRight: metricType === "stress" ? 2 : 0,
            paddingTop: metricType === "steps" ? 0 : 0,
          }}
        >
          {chart}
        </View>
      )}
    </View>
  );
}
