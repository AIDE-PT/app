import React from "react";
import { View } from "react-native"; // Importar View
import { Svg, Path } from "react-native-svg";

interface ArrowProps {
  variant: "UP" | "DOWN" | "LEFT" | "RIGHT";
  dark?: boolean;
  size?: number;
  className?: string;
}

const ArrowIcon = ({ variant, size = 20, className, dark }: ArrowProps) => {
  const rotations = {
    LEFT: "rotate-0",
    RIGHT: "rotate-180",
    UP: "rotate-90",
    DOWN: "-rotate-90",
  };

  const rotationClass = rotations[variant] || "rotate-0";

  return (
    <View className={`${rotationClass} ${className}`}>
      <Svg width={size} height={size} viewBox="0 0 24 20" fill="none">
        <Path
          d="M14.4 20C13.925 20 13.45 19.8166 13.0833 19.45L3.75 9.99998L13.0833 0.549982C13.2547 0.375877 13.459 0.237609 13.6843 0.143229C13.9097 0.0488493 14.1515 0.000244141 14.3958 0.000244141C14.6401 0.000244141 14.882 0.0488493 15.1073 0.143229C15.3327 0.237609 15.537 0.375877 15.7083 0.549982C16.4333 1.28332 16.4333 2.46665 15.7083 3.19998L8.99167 9.99998L15.7083 16.8C16.4333 17.5333 16.4333 18.7166 15.7083 19.45C15.3417 19.8166 14.875 20 14.4 20Z"
          fill={dark ? "white" : "#111111"}
        />
      </Svg>
    </View>
  );
};

export default ArrowIcon;
