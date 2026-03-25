import { LinearGradient } from "expo-linear-gradient";
import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View } from "react-native";
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

type BgStatus = "good" | "warning" | "critical";

const ONBOARDING_ROUTES = new Set([
  "/",
  "/index",
  "/terms-of-service",
  "/register",
  "/login",
]);

const APP_BG_COLORS = {
  dark: "#000746",
  light: "#ECF5FF",
} as const;

const BG_COLORS = {
  good: {
    dark: ["#000720", "#000746"] as const,
    light: ["#AECFFF", "#AECFFF"] as const,
  },
  warning: {
    dark: ["#1A1200", "#2B1F00"] as const,
    light: ["#FFD84D", "#FFCF33"] as const,
  },
  critical: {
    dark: ["#1A0007", "#2A000F"] as const,
    light: ["#FF8FA3", "#FF7090"] as const,
  },
};

interface LightBackgroundProps {
  children?: React.ReactNode;
  status?: BgStatus;
  forceLight?: boolean;
}

export const LightBackground = ({
  children,
  status = "good",
  forceLight = false,
}: LightBackgroundProps) => {
  const { isDark } = useTheme();
  const pathname = usePathname();
  const useDarkMode = !forceLight && isDark;
  const isOnboardingRoute = ONBOARDING_ROUTES.has(pathname);

  const fadeAnim = useRef({
    good: new Animated.Value(status === "good" ? 1 : 0),
    warning: new Animated.Value(status === "warning" ? 1 : 0),
    critical: new Animated.Value(status === "critical" ? 1 : 0),
  }).current;
  const prevStatus = useRef<BgStatus>(status);

  useEffect(() => {
    if (prevStatus.current === status) return;
    Animated.parallel([
      Animated.timing(fadeAnim[prevStatus.current], {
        toValue: 0,
        duration: 1200,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim[status], {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
    prevStatus.current = status;
  }, [status]);

  if (!isOnboardingRoute) {
    return (
      <View
        className="flex-1"
        style={{
          backgroundColor: useDarkMode
            ? APP_BG_COLORS.dark
            : APP_BG_COLORS.light,
        }}
      >
        {children}
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Cross-fading background gradients */}
      {(["good", "warning", "critical"] as const).map((s) => (
        <Animated.View
          key={s}
          style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim[s] }]}
        >
          <LinearGradient
            colors={BG_COLORS[s][useDarkMode ? "dark" : "light"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      ))}

      {/* Dot Pattern Overlay */}
      <DotPattern isDark={useDarkMode} />

      {/* Content */}
      {children}
    </View>
  );
};

export default LightBackground;
