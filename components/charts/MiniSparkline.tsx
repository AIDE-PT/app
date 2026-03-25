import React, { useMemo } from "react";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { View, Text } from "react-native";

interface MiniSparklineProps {
  data: number[];
  width: number;
  height: number;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientFromOpacity?: number;
  gradientToOpacity?: number;
  yMin?: number;
  yMax?: number;
}

// Cubic bezier smoothing for a natural curve
function smoothPath(
  points: { x: number; y: number }[],
  tension: number = 0.4,
): string {
  if (points.length < 2) return "";
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) * tension;
    const cp1y = p0.y;
    const cp2x = p1.x - (p1.x - p0.x) * tension;
    const cp2y = p1.y;
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }
  return path;
}

export default function MiniSparkline({
  data,
  width,
  height,
  color = "#3B82F6",
  gradientFrom = "#3B82F6",
  gradientTo = "#3B82F6",
  gradientFromOpacity = 0.4,
  gradientToOpacity = 0,
  yMin,
  yMax,
}: MiniSparklineProps) {
  // Generate unique gradient ID to avoid conflicts when multiple sparklines are rendered
  const gradientId = useMemo(
    () => `grad-${Math.random().toString(36).substr(2, 9)}`,
    [],
  );

  if (!data || data.length < 2) return null;

  const min = yMin !== undefined ? yMin : Math.min(...data);
  const max = yMax !== undefined ? yMax : Math.max(...data);
  const range = max - min || 1;

  // Generate Y-axis labels for temperature (35-40 range)
  const showAllLabels = yMin === 35 && yMax === 40;
  const yLabels = showAllLabels
    ? [40, 39, 38, 37, 36, 35]
    : yMin !== undefined && yMax !== undefined
      ? [yMax, yMin]
      : null;

  // Build points with some vertical padding
  const padding = 2;
  const labelWidth = showAllLabels ? 14 : yMin !== undefined ? 18 : 0;
  const availableHeight = height - padding * 2;
  const availableWidth = width - labelWidth;

  const points = data.map((val, i) => {
    const x = labelWidth + (i / (data.length - 1)) * availableWidth;
    const y = height - padding - ((val - min) / range) * availableHeight;
    return { x, y };
  });

  const linePath = smoothPath(points);

  // Build fill path (close the shape at the bottom)
  const fillPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  // Calculate Y positions for grid lines
  const gridLineStartX = showAllLabels ? 12 : 0;

  // Calculate Y positions for each label
  const getYPosition = (labelValue: number): number => {
    const padding = 2;
    const availableHeight = height - padding * 2;
    return height - padding - ((labelValue - min) / range) * availableHeight;
  };

  return (
    <View style={{ width, height, position: "relative" }}>
      {yLabels && (
        <View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            justifyContent: "space-between",
            zIndex: 10,
          }}
        >
          {yLabels.map((label, index) => (
            <Text
              key={index}
              style={{
                fontSize: 12,
                color: showAllLabels ? "#3B82F6" : "#94A3B8",
                fontWeight: "bold",
              }}
            >
              {label}
            </Text>
          ))}
        </View>
      )}
      <Svg width={width} height={height} style={{ zIndex: 5 }}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0%"
              stopColor={gradientFrom}
              stopOpacity={gradientFromOpacity}
            />
            <Stop
              offset="100%"
              stopColor={gradientTo}
              stopOpacity={gradientToOpacity}
            />
          </LinearGradient>
        </Defs>
        <Path d={fillPath} fill={`url(#${gradientId})`} />
        <Path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
