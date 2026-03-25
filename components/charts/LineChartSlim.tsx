import React from "react";
import { Dimensions, ViewStyle, StyleSheet } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useTheme } from "@/hooks/useTheme";

const defaultWidth = Dimensions.get("window").width - 32;
const DEFAULT_LIGHT_LABEL_COLOR = "rgba(17, 24, 39, 0.92)";

interface SimpleLineChartProps {
  // Dados e Dimensões
  data?: number[];
  height?: number;
  width?: number;

  // Cores da Linha e Gradiente
  lineColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientFromOpacity?: number;
  gradientToOpacity?: number;

  // Fundo e Labels
  backgroundGradient?: string;
  labelColor?: string;
  labelFontSize?: number;
  yAxisSuffix?: string;
  showYLabels?: boolean;

  // Linhas de Grade (Grid)
  gridColor?: string;
  gridStrokeWidth?: number;
  gridDashArray?: string;
  segments?: number;

  // Range fixo
  yMin?: number;
  yMax?: number;

  style?: ViewStyle;
}

export default function SimpleLineChart({
  data = [
    5, 10, 6, 12, 8, 14, 9, 9, 10, 6, 10, 6, 12, 6, 10, 6, 12, 8, 14, 9, 10, 6,
    1,
  ],
  height = 70,
  width = defaultWidth,

  lineColor = "#5C6CFF",
  gradientFrom = "#7BA1FF",
  gradientTo = "#243AFF",
  gradientFromOpacity = 0.6,
  gradientToOpacity = 0,

  backgroundGradient = "#ffffff",
  labelColor = DEFAULT_LIGHT_LABEL_COLOR,
  labelFontSize = 10,
  yAxisSuffix = "",
  showYLabels = true,

  gridColor = "#E5E7EB",
  gridStrokeWidth = 1,
  gridDashArray = "4",
  segments = 3,

  yMin,
  yMax,

  style,
}: SimpleLineChartProps) {
  const { isDark } = useTheme();

  // Dark mode background colors
  const darkBgGradient = "rgba(0, 4, 18, 0.95)";
  const darkLabelColor = "rgba(255, 255, 255, 0.6)";
  const darkGridColor = "rgba(255, 255, 255, 0.1)";

  const bgGradient = backgroundGradient === "#ffffff" && isDark ? darkBgGradient : backgroundGradient;
  const lblColor = labelColor === DEFAULT_LIGHT_LABEL_COLOR && isDark ? darkLabelColor : labelColor;
  const grdColor = gridColor === "#E5E7EB" && isDark ? darkGridColor : gridColor;

  const combinedStyle = StyleSheet.flatten([
    {
      marginVertical: 8,
      borderRadius: 16,
      paddingRight: showYLabels ? 35 : 0,
    },
    style,
  ]);

  const datasets: any[] = [{ data }];

  // Hack para forçar o range do eixo Y
  if (yMin !== undefined && yMax !== undefined) {
    datasets.push({
      data: [yMin, yMax],
      color: () => "transparent",
      withDots: false,
      withShadow: false, // Don't draw area shadow for the scaling dataset
    });
  }

  return (
    <LineChart
      data={{
        labels: [],
        datasets: datasets,
      }}
      width={width}
      height={height}
      yAxisSuffix={yAxisSuffix}
      fromNumber={yMax}
      withDots={false}
      withShadow={false}
      withInnerLines={true}
      withOuterLines={false}
      withHorizontalLabels={showYLabels}
      withVerticalLabels={false}
      withHorizontalLines={true}
      withVerticalLines={false}
      segments={segments}
      bezier
      chartConfig={{
        backgroundGradientFrom: bgGradient,
        backgroundGradientTo: bgGradient,
        decimalPlaces: 0,
        labelColor: () => lblColor,
        propsForLabels: {
          fontSize: labelFontSize,
        },
        color: () => lineColor,
        fillShadowGradient: gradientFrom,
        fillShadowGradientOpacity: 0,
        fillShadowGradientTo: gradientTo,
        fillShadowGradientToOpacity: 0,
        propsForBackgroundLines: {
          strokeDasharray: gridDashArray,
          strokeWidth: gridStrokeWidth,
          stroke: grdColor,
        },
        propsForDots: {
          r: "0",
        },
      }}
      style={combinedStyle}
    />
  );
}
