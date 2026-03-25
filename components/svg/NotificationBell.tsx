import React from "react";
import { Path, Svg, SvgProps } from "react-native-svg";

const NotificationBell = ({
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
      accessible={props.accessible ?? false}
      focusable={false}
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <Path d="M18 9A6 6 0 0 0 6 9c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 22a2 2 0 0 1-3.46 0" />
      <Path d="M12 2v3" />
    </Svg>
  );
};

export default NotificationBell;
