import React from "react";
import { Circle, Path, Svg, SvgProps } from "react-native-svg";

const SettingsIcon = ({
  size = 24,
  color = "#000000",
  ...props
}: SvgProps & { size?: number; color?: string }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  );
};

export default SettingsIcon;
