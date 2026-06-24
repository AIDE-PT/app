import React from "react";
import { Dimensions, ViewStyle, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useTheme } from "@/hooks/useTheme";

const defaultWidth = Dimensions.get("window").width - 32;
const DEFAULT_LIGHT_LABEL_COLOR = "rgba(17, 24, 39, 0.92)";

interface SimpleLineChartProps {
  // Dados e Dimensões
  data?: number[];
  labels?: string[];
  showXLabels?: boolean;
  showDots?: boolean;
  hideDotsAtIndex?: number[];
  dotRadius?: number;
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
  fromZero?: boolean;

  style?: ViewStyle;
}

export default function SimpleLineChart({
  data = [
    5, 10, 6, 12, 8, 14, 9, 9, 10, 6, 10, 6, 12, 6, 10, 6, 12, 8, 14, 9, 10, 6,
    1,
  ],
  labels = [],
  showXLabels = false,
  showDots = false,
  hideDotsAtIndex = [],
  dotRadius = 3.6,
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
  fromZero = false,

  style,
}: SimpleLineChartProps) {
  const { isDark } = useTheme();

  // Dark mode background colors
  const darkBgGradient = "rgba(0, 4, 18, 0.95)";
  const darkLabelColor = "rgba(255, 255, 255, 0.6)";
  const darkGridColor = "rgba(255, 255, 255, 0.1)";

  const bgGradient =
    backgroundGradient === "#ffffff" && isDark
      ? darkBgGradient
      : backgroundGradient;
  const lblColor =
    labelColor === DEFAULT_LIGHT_LABEL_COLOR && isDark
      ? darkLabelColor
      : labelColor;
  const grdColor =
    gridColor === "#E5E7EB" && isDark ? darkGridColor : gridColor;

  const chartPaddingLeft = showYLabels ? 35 : 0;
  const xLabelWidth = 34;
  const xPointCount = Math.max(data.length, labels.length, 1);
  const xLabelStep = (width - chartPaddingLeft) / xPointCount;

  const combinedStyle = StyleSheet.flatten([
    {
      marginVertical: 8,
      borderRadius: 16,
      paddingRight: chartPaddingLeft,
    },
    style,
  ]);

  const datasets: any[] = [{ data }];

  const getNiceStep = (rawStep: number) => {
    if (!Number.isFinite(rawStep) || rawStep <= 0) return 1;
    const magnitude = 10 ** Math.floor(Math.log10(rawStep));
    const normalized = rawStep / magnitude;
    const multiplier =
      normalized <= 1
        ? 1
        : normalized <= 2
          ? 2
          : normalized <= 2.5
            ? 2.5
            : normalized <= 5
              ? 5
              : 10;
    return multiplier * magnitude;
  };

  const computedYMax =
    yMax ??
    (fromZero
      ? Math.max(
          getNiceStep(Math.max(...data, 1) / Math.max(segments, 1)) *
            Math.max(segments, 1),
          1,
        )
      : undefined);
  const shouldStartFromZero = fromZero || yMin === 0;

  const formatYAxisLabel = (rawValue: string) => {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return rawValue;

    const abs = Math.abs(value);
    if (abs >= 1000 && !yAxisSuffix.trim()) {
      const compact =
        abs >= 10000 ? (value / 1000).toFixed(1) : (value / 1000).toFixed(1);
      return `${compact.replace(".", ",").replace(/,0$/, "")}k`;
    }

    return Math.round(value).toLocaleString("pt-PT");
  };

  // Hack para forçar o range do eixo Y
  if (yMin !== undefined && computedYMax !== undefined) {
    datasets.push({
      data: [yMin, computedYMax],
      color: () => "transparent",
      withDots: false,
      withShadow: false, // Don't draw area shadow for the scaling dataset
    });
  }

  return (
    <View style={{ width }}>
      <LineChart
        data={{
          labels: [],
          datasets: datasets,
        }}
        width={width}
        height={height}
        yAxisSuffix={yAxisSuffix}
        fromNumber={computedYMax}
        fromZero={shouldStartFromZero}
        withDots={showDots}
        hidePointsAtIndex={hideDotsAtIndex}
        withShadow={false}
        withInnerLines={true}
        withOuterLines={false}
        withHorizontalLabels={showYLabels}
        withVerticalLabels={false}
        withHorizontalLines={true}
        withVerticalLines={false}
        yLabelsOffset={8}
        formatYLabel={formatYAxisLabel}
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
            r: String(dotRadius),
            stroke: bgGradient,
            strokeWidth: "2",
          },
        }}
        style={combinedStyle}
      />
      {showXLabels && labels.length > 0 ? (
        <View pointerEvents="none" style={styles.xLabels}>
          {labels.map((label, index) => {
            const x = chartPaddingLeft + index * xLabelStep;

            return (
              <Text
                key={`${label}-${index}`}
                numberOfLines={1}
                style={[
                  styles.xLabel,
                  {
                    color: lblColor,
                    fontSize: labelFontSize,
                    left: x - xLabelWidth / 2,
                    opacity: label ? 1 : 0,
                    width: xLabelWidth,
                  },
                ]}
              >
                {label || " "}
              </Text>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  xLabels: {
    bottom: 2,
    height: 14,
    left: 0,
    position: "absolute",
    right: 0,
  },
  xLabel: {
    fontWeight: "500",
    position: "absolute",
    textAlign: "center",
  },
});
