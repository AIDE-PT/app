import { LinearGradient } from "expo-linear-gradient";
import { Dimensions, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "@/hooks/useTheme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Dot Pattern Component
const DotPattern = ({ isDark }: { isDark: boolean }) => {
  const dotSpacing = 24;
  const dotSize = 3;
  const cols = Math.ceil(SCREEN_WIDTH / dotSpacing) + 1;
  const rows = Math.ceil(SCREEN_HEIGHT / dotSpacing) + 1;

  const dots = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      dots.push(
        <Circle
          key={`${row}-${col}`}
          cx={col * dotSpacing + dotSpacing / 2}
          cy={row * dotSpacing + dotSpacing / 2}
          r={dotSize / 2}
          fill={isDark ? "rgba(255, 255, 255, 0.05)" : "white"}
          opacity={isDark ? 1 : 0.5}
        />,
      );
    }
  }

  return (
    <View className="absolute inset-0">
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
        {dots}
      </Svg>
    </View>
  );
};

interface LightBackgroundProps {
  children?: React.ReactNode;
}

export const LightBackground = ({ children }: LightBackgroundProps) => {
  const { isDark } = useTheme();

  return (
    <View className="flex-1">
      {/* Background Gradient */}
      {isDark ? (
        <LinearGradient
          colors={["#000720", "#000746"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="absolute inset-0"
        />
      ) : (
        <View className="absolute inset-0 bg-[#ECF5FF]" />
      )}

      {/* Dot Pattern Overlay */}
      <DotPattern isDark={isDark} />

      {/* Content */}
      {children}
    </View>
  );
};

export default LightBackground;
