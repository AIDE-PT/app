import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface MiniSparklineProps {
  data: number[];
  width: number;
  height: number;
  color?: string;
}

export default function MiniSparkline({
  data,
  width,
  height,
  color = '#5061FF' // aide-normal-blue from Tailwind config
}: MiniSparklineProps) {

  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}