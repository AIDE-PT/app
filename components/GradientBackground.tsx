import { LinearGradient } from "expo-linear-gradient";
import { createContext, useContext, useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { SharedValue, useSharedValue } from "react-native-reanimated";
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
    <View style={StyleSheet.absoluteFillObject}>
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
        {dots}
      </Svg>
    </View>
  );
};

// Context to share scroll position (kept for compatibility)
interface GradientContextType {
  scrollY: SharedValue<number>;
  contentHeight: SharedValue<number>;
}

const GradientContext = createContext<GradientContextType | null>(null);

// Hook to access scroll values
export const useGradientScroll = () => {
  const context = useContext(GradientContext);
  if (!context) {
    throw new Error("useGradientScroll must be used within GradientBackground");
  }
  return context;
};

interface GradientBackgroundProps {
  children?: React.ReactNode;
  forceLight?: boolean;
}

export const GradientBackground = ({
  children,
  forceLight = false,
}: GradientBackgroundProps) => {
  const scrollY = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const { isDark } = useTheme();
  const useDarkMode = !forceLight && isDark;

  // Create context value (kept for compatibility with scroll tracking)
  const contextValue = useMemo(
    () => ({
      scrollY,
      contentHeight,
    }),
    [scrollY, contentHeight],
  );

  return (
    <GradientContext.Provider value={contextValue}>
      <View style={styles.container}>
        {/* Background gradient - different for light/dark mode */}
        {useDarkMode ? (
          <LinearGradient
            colors={["#000720", "#000746"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        ) : (
          <View style={StyleSheet.absoluteFillObject} />
        )}

        {/* Dot Pattern Overlay */}
        <DotPattern isDark={useDarkMode} />

        {/* Content */}
        {children}
      </View>
    </GradientContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default GradientBackground;
