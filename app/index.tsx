import { useFonts } from "expo-font";
import { useEffect } from "react";
import { Dimensions, Text, View } from "react-native";
import { router } from "expo-router";
import "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { Button } from "../components/buttons/button";
import { LightBackground } from "../components/LightBackground";
import "../global.css";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Create animated circle component
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// AIDE Logo Component using the actual brand icon
const AideLogo = ({ size = 80 }: { size?: number }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 324 324">
      <Path
        d="M322.334 30.9101C322.334 13.027 307.801 -1.63785 290.007 0.147512C258.574 3.30136 227.713 11.0442 198.419 23.1779C159.134 39.4505 123.438 63.3017 93.3698 93.3696C63.3018 123.438 39.4506 159.133 23.1779 198.419C11.0442 227.712 3.30136 258.574 0.147512 290.006C-1.63785 307.8 13.027 322.333 30.9102 322.333C48.7934 322.333 63.0821 307.78 65.3117 290.037C68.1919 267.116 74.1315 244.634 83.0091 223.202C96.0272 191.773 115.108 163.217 139.163 139.162C163.217 115.108 191.774 96.027 223.202 83.0089C244.635 74.1313 267.116 68.1918 290.037 65.3116C307.781 63.082 322.334 48.7933 322.334 30.9101Z"
        fill="#ffffffff"
      />
      <Rect
        x="324"
        y="324.008"
        width="64.735"
        height="225.233"
        rx="32.3675"
        transform="rotate(180 324 324.008)"
        fill="#ffffffff"
      />
      <Rect
        x="215.283"
        y="243.758"
        width="64.735"
        height="64.7341"
        rx="32.367"
        transform="rotate(180 215.283 243.758)"
        fill="#ffffffff"
      />
    </Svg>
  );
};

// Animated Ring Component - Using pulse-ring animation
// Keyframes: 0% scale(0.8) opacity(0) -> 50% scale(1.5) opacity(0.5) -> 100% scale(2.2) opacity(0)
const AnimatedRing = ({
  centerX,
  centerY,
  baseRadius,
  color,
  strokeWidth,
  isDashed,
  delay,
}: {
  centerX: number;
  centerY: number;
  baseRadius: number;
  color: string;
  strokeWidth: number;
  isDashed: boolean;
  delay: number;
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration: 3000,
          // cubic-bezier(0.215, 0.61, 0.355, 1) - easeOutCubic approximation
          easing: Easing.bezier(0.215, 0.61, 0.355, 1),
        }),
        -1, // Infinite
        false, // No reverse - continuous loop
      ),
    );
  }, [delay, progress]);

  const animatedProps = useAnimatedProps(() => {
    // pulse-ring keyframes:
    // 0%: scale(0.8), opacity: 0
    // 50%: scale(1.5), opacity: 0.5
    // 100%: scale(2.2), opacity: 0
    const scale = interpolate(progress.value, [0, 0.5, 1], [0.8, 1.5, 2.2]);
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0, 0.5, 0]);

    return {
      r: baseRadius * scale,
      opacity: opacity,
    };
  });

  return (
    <AnimatedCircle
      cx={centerX}
      cy={centerY}
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeDasharray={isDashed ? "8 8" : undefined}
      animatedProps={animatedProps}
    />
  );
};

// Concentric Rings Component with Animation
const ConcentricRings = () => {
  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT * 0.35;

  const rings = [
    { radius: 45, color: "#5C7CFA", strokeWidth: 2, isDashed: false, delay: 0 }, // primary-600
    {
      radius: 70,
      color: "#748FFC",
      strokeWidth: 1.5,
      isDashed: false,
      delay: 300,
    }, // accent-light
    {
      radius: 100,
      color: "#BAC8FF",
      strokeWidth: 1,
      isDashed: false,
      delay: 600,
    }, // success-light
    {
      radius: 140,
      color: "#3B5BDB",
      strokeWidth: 1,
      isDashed: true,
      delay: 900,
    }, // primary-800
    {
      radius: 190,
      color: "#3B5BDB",
      strokeWidth: 1,
      isDashed: true,
      delay: 1200,
    }, // primary-800
  ];

  return (
    <View
      className="absolute top-0 left-0 right-0"
      style={{ height: SCREEN_HEIGHT * 0.6 }}
    >
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT * 0.6}>
        {rings.map((ring, index) => (
          <AnimatedRing
            key={index}
            centerX={centerX}
            centerY={centerY}
            baseRadius={ring.radius}
            color={ring.color}
            strokeWidth={ring.strokeWidth}
            isDashed={ring.isDashed}
            delay={ring.delay}
          />
        ))}
      </Svg>
    </View>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    "Safiro-Medium": require("../assets/fonts/safiro/safiro-medium-webfont.ttf"),
    "OpenSans-Regular": require("../assets/fonts/open-sans/OpenSans-Regular.ttf"),
    "OpenSans-SemiBold": require("../assets/fonts/open-sans/OpenSans-SemiBold.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1">
      <LightBackground>
        {/* Concentric Rings */}
        <ConcentricRings />

        {/* Center Logo Container */}
        <View
          className="absolute w-[110px] h-[110px] justify-center items-center"
          style={{
            top: SCREEN_HEIGHT * 0.35 - 55,
            left: SCREEN_WIDTH / 2 - 55,
          }}
        >
          {/* Middle glow */}
          <View className="absolute w-[150px] h-[150px] rounded-full bg-[#A9BDFF] opacity-80" />

          {/* Inner circle with logo */}
          <View className="w-[100px] h-[100px] rounded-full bg-[#9AADE8] justify-center items-center shadow-lg">
            <AideLogo size={55} />
          </View>
        </View>

        {/* Content Container */}
        <View className="flex-1 justify-end px-8 pb-[60px]">
          {/* Title - Using Safiro font */}
          <Text className="font-safiro text-[32px] leading-[42px] text-[#1A1A2E] text-center mb-4">
            O futuro do cuidado{"\n"}é conectado.
          </Text>

          {/* Subtitle - Using Open Sans */}
          <Text className="font-open-sans text-base text-[#4B5563] text-center leading-6 mb-10 px-4">
            Simples. Inteligente. Humano.{"\n"}
            Gerir a saúde e bem-estar na palma da tua mão.
          </Text>

          {/* CTA Button */}
          <View className="items-center">
            <Button
              variant="primary"
              label="Começa Já!"
              onPress={() => router.push("/associar")}
            />
          </View>
        </View>
      </LightBackground>
    </SafeAreaView>
  );
}
