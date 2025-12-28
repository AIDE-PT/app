import React from 'react';
import { Dimensions, ViewStyle, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const defaultWidth = Dimensions.get('window').width - 32;

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

  style?: ViewStyle;
}

export default function SimpleLineChart({
  data = [5, 10, 6, 12, 8, 14, 9, 9, 10, 6, 10, 6, 12, 6, 10, 6, 12, 8, 14, 9, 10, 6, 1],
  height = 70,
  width = defaultWidth,

  lineColor = '#5C6CFF',
  gradientFrom = '#7BA1FF',
  gradientTo = '#243AFF',
  gradientFromOpacity = 0.6,
  gradientToOpacity = 0,

  backgroundGradient = '#ffffff',
  labelColor = 'rgba(124, 137, 255, 1)',
  labelFontSize = 10,
  yAxisSuffix = "",
  showYLabels = true,

  gridColor = "#E5E7EB",
  gridStrokeWidth = 1,
  gridDashArray = "4",
  segments = 3,

  style,
}: SimpleLineChartProps) {

  const combinedStyle = StyleSheet.flatten([
    {
      marginVertical: 8,
      borderRadius: 16,
      paddingRight: showYLabels ? 35 : 0,
    },
    style,
  ]);

  return (
    <LineChart
      data={{
        labels: [],
        datasets: [{ data }],
      }}
      width={width}
      height={height}
      yAxisSuffix={yAxisSuffix}
      withDots={false}
      withShadow={true}
      withInnerLines={true}
      withOuterLines={false}
      withHorizontalLabels={showYLabels}
      withVerticalLabels={false}
      withHorizontalLines={true}
      withVerticalLines={false}
      segments={segments}
      bezier
      chartConfig={{
        backgroundGradientFrom: backgroundGradient,
        backgroundGradientTo: backgroundGradient,
        decimalPlaces: 0,
        labelColor: () => labelColor,
        propsForLabels: {
          fontSize: labelFontSize,
        },
        color: () => lineColor,
        fillShadowGradient: gradientFrom,
        fillShadowGradientOpacity: gradientFromOpacity,
        fillShadowGradientTo: gradientTo,
        fillShadowGradientToOpacity: gradientToOpacity,
        propsForBackgroundLines: {
          strokeDasharray: gridDashArray,
          strokeWidth: gridStrokeWidth,
          stroke: gridColor,
        },
        propsForDots: {
          r: '0',
        },
      }}
      style={combinedStyle}
    />
  );
}