import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { BlurView } from "expo-blur";
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface HealthStatusHeroProps {
  userName?: string;
  cuidadoName?: string;
  status?: "good" | "warning" | "critical";
  onCheckNotifications?: () => void;
  topExtension?: number;
}

export default function HealthStatusHero({
  userName = "Juliana K.",
  cuidadoName = "Emilia Almeida",
  status = "good",
  onCheckNotifications,
  topExtension = 0,
}: HealthStatusHeroProps) {
  const { isDark } = useTheme();
  const isGood = status === "good";
  const { width } = useWindowDimensions();

  // Color Palettes — bgGradient includes transparent at bottom so card fades out naturally
  const themeColors = {
    good: {
      bgGradient: isDark
        ? (["#0A1A3A", "#020510", "transparent"] as const)
        : (["#BEDAFF", "#BEDAFF", "transparent"] as const),
      waveGradientTop: isDark
        ? "rgba(80, 130, 255, 0.18)"
        : "rgba(50, 130, 255, 0.55)",
      waveGradientBottom: isDark
        ? "rgba(80, 130, 255, 0.0)"
        : "rgba(255, 255, 255, 0.0)",
      textMain: isDark ? "#FFFFFF" : "#0A1A3A",
      textSub: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(10, 26, 58, 0.6)",
      iconBg: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.03)",
      badgeBg: isDark ? "#0A1829" : "#93C5FD",
      badgeColor: isDark ? "#60A5FA" : "#1D4ED8",
      btnBorder: isDark ? "#60A5FA" : "#1D4ED8",
    },
    warning: {
      bgGradient: isDark
        ? (["#3A3011", "#050401", "transparent"] as const)
        : (["#FFD84D", "#FFD84D", "transparent"] as const),
      waveGradientTop: isDark
        ? "rgba(224, 195, 105, 0.15)"
        : "rgba(180, 120, 0, 0.3)",
      waveGradientBottom: isDark
        ? "rgba(224, 195, 105, 0.0)"
        : "rgba(255, 255, 255, 0.0)",
      textMain: isDark ? "#FFFFFF" : "#2D1F00",
      textSub: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(45, 31, 0, 0.6)",
      iconBg: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.03)",
      badgeBg: isDark ? "#1E180C" : "#FFC72C",
      badgeColor: isDark ? "#EAD288" : "#7A4700",
      btnBorder: isDark ? "#EAD288" : "#92530A",
    },
    critical: {
      bgGradient: isDark
        ? (["#3A111A", "#050102", "transparent"] as const)
        : (["#FF8FA3", "#FF8FA3", "transparent"] as const),
      waveGradientTop: isDark
        ? "rgba(224, 105, 125, 0.15)"
        : "rgba(200, 30, 60, 0.3)",
      waveGradientBottom: isDark
        ? "rgba(224, 105, 125, 0.0)"
        : "rgba(255, 255, 255, 0.0)",
      textMain: isDark ? "#FFFFFF" : "#2A0008",
      textSub: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(42, 0, 8, 0.6)",
      iconBg: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.03)",
      badgeBg: isDark ? "#1E0C11" : "#FF4D6D",
      badgeColor: isDark ? "#E8889C" : "#FFFFFF",
      btnBorder: isDark ? "#E8889C" : "#C9002B",
    },
  };

  const colors = themeColors[status];
  const animation = useRef(new Animated.Value(0)).current;
  const waveLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Cross-fade opacity values for smooth status transitions
  const fadeAnim = useRef({
    good: new Animated.Value(status === "good" ? 1 : 0),
    warning: new Animated.Value(status === "warning" ? 1 : 0),
    critical: new Animated.Value(status === "critical" ? 1 : 0),
  }).current;
  const prevStatus = useRef(status);

  // 1 = good (badge centered), 0 = warning/critical (badge shifted left, button visible)
  const badgeShiftAnim = useRef(
    new Animated.Value(status !== "good" ? 0 : 1),
  ).current;

  useEffect(() => {
    if (prevStatus.current === status) return;
    const toGood = status === "good";
    Animated.parallel([
      Animated.timing(fadeAnim[prevStatus.current], {
        toValue: 0,
        duration: 900,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim[status], {
        toValue: 1,
        duration: 900,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(badgeShiftAnim, {
        toValue: toGood ? 1 : 0,
        duration: 700,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
    prevStatus.current = status;
  }, [status]);

  // Seamless looping wave
  const waveWidth = width * 2;
  const topWaveSvgHeight = 520;

  const topWavePath1 = `M0 ${topWaveSvgHeight * 0.4} 
    C ${waveWidth * 0.5} ${topWaveSvgHeight * 0.05}, ${waveWidth * 0.5} ${topWaveSvgHeight * 0.95}, ${waveWidth} ${topWaveSvgHeight * 0.4} 
    C ${waveWidth * 1.5} ${topWaveSvgHeight * 0.05}, ${waveWidth * 1.5} ${topWaveSvgHeight * 0.95}, ${waveWidth * 2} ${topWaveSvgHeight * 0.4} 
    L ${waveWidth * 2} ${topWaveSvgHeight} L 0 ${topWaveSvgHeight} Z`;

  const topWavePath2 = `M0 ${topWaveSvgHeight * 0.5} 
    C ${waveWidth * 0.5} ${topWaveSvgHeight * 0.95}, ${waveWidth * 0.5} ${topWaveSvgHeight * 0.05}, ${waveWidth} ${topWaveSvgHeight * 0.5} 
    C ${waveWidth * 1.5} ${topWaveSvgHeight * 0.95}, ${waveWidth * 1.5} ${topWaveSvgHeight * 0.05}, ${waveWidth * 2} ${topWaveSvgHeight * 0.5} 
    L ${waveWidth * 2} ${topWaveSvgHeight} L 0 ${topWaveSvgHeight} Z`;

  const stopWaveAnimation = useCallback(() => {
    waveLoopRef.current?.stop();
    waveLoopRef.current = null;
  }, []);

  const startWaveAnimation = useCallback(() => {
    stopWaveAnimation();
    animation.setValue(0);
    waveLoopRef.current = Animated.loop(
      Animated.timing(animation, {
        toValue: 1,
        duration: 40000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    waveLoopRef.current.start();
  }, [animation, stopWaveAnimation]);

  useEffect(() => {
    startWaveAnimation();
    return () => stopWaveAnimation();
  }, [startWaveAnimation, stopWaveAnimation]);

  const translateX1 = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -waveWidth],
  });

  const translateX2 = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-waveWidth, 0],
  });

  const CARD_HEIGHT = 300;

  // badge shift = half of (button width + gap) so badge appears centered when button is hidden
  // button (~170px) + gap (16px) = 186px → half = 93px
  const BADGE_SHIFT = 93;
  const badgeTX = badgeShiftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BADGE_SHIFT],
  });
  const buttonOpacity = badgeShiftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const buttonTX = badgeShiftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 24],
  });
  const absoluteFill = StyleSheet.absoluteFillObject as ViewStyle;

  return (
    <View style={styles.container}>
      <View style={[styles.card, { height: CARD_HEIGHT + topExtension }]}>
        {/* Stacked gradients — cross-fade on status change; fade to transparent at bottom */}
        {(["good", "warning", "critical"] as const).map((s) => (
          <Animated.View
            key={s}
            style={[absoluteFill, { opacity: fadeAnim[s] }]}
          >
            <LinearGradient
              colors={themeColors[s].bgGradient}
              locations={[0, 0.6, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={absoluteFill}
            />
          </Animated.View>
        ))}

        {/* Animated Smooth Background Waves — Top (mirrored, tall) */}
        <View style={styles.waveContainerTop}>
          <Animated.View
            style={{
              transform: [{ translateX: translateX1 }, { scaleY: -1 }],
              position: "absolute",
              width: waveWidth * 2,
              height: topWaveSvgHeight,
              top: -120,
            }}
          >
            <Svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${waveWidth * 2} ${topWaveSvgHeight}`}
              preserveAspectRatio="none"
            >
              <Defs>
                <SvgLinearGradient id="waveGrad3" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.waveGradientTop} />
                  <Stop offset="1" stopColor={colors.waveGradientBottom} />
                </SvgLinearGradient>
              </Defs>
              <Path d={topWavePath1} fill="url(#waveGrad3)" />
            </Svg>
          </Animated.View>

          <Animated.View
            style={{
              transform: [{ translateX: translateX2 }, { scaleY: -1 }],
              position: "absolute",
              width: waveWidth * 2,
              height: topWaveSvgHeight,
              top: -100,
              opacity: 0.8,
            }}
          >
            <Svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${waveWidth * 2} ${topWaveSvgHeight}`}
              preserveAspectRatio="none"
            >
              <Defs>
                <SvgLinearGradient id="waveGrad4" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.waveGradientTop} />
                  <Stop offset="1" stopColor={colors.waveGradientBottom} />
                </SvgLinearGradient>
              </Defs>
              <Path d={topWavePath2} fill="url(#waveGrad4)" />
            </Svg>
          </Animated.View>
        </View>

        {/* Content — three layers cross-fading on status change */}
        {(["good", "warning", "critical"] as const).map((s) => {
          const c = themeColors[s];
          const subtitleMap = {
            good: "Tudo estabilizado",
            warning: "Requer alguma atenção",
            critical: "Intervenção imediata",
          };
          const badgeIconMap = {
            good: "shield",
            warning: "alert-circle",
            critical: "alert-triangle",
          } as const;
          const btnBg =
            s === "warning" ? (isDark ? "#D97706" : "#F59E0B") : "#E11D48";
          return (
            <Animated.View
              key={s}
              pointerEvents={status === s ? "auto" : "none"}
              style={[
                styles.content,
                {
                  paddingTop: topExtension + 90,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: fadeAnim[s],
                },
              ]}
            >
              {/* Titles */}
              <View style={styles.titleContainer}>
                <Text style={[styles.cuidadoNameText, { color: c.textMain }]}>
                  {cuidadoName}
                </Text>
                <Text style={[styles.subtitleText, { color: c.textSub }]}>
                  {subtitleMap[s]}
                </Text>
              </View>

              {/* Bottom Status / Action — badge slides left while button fades in */}
              <View style={styles.bottomRow}>
                <Animated.View style={{ transform: [{ translateX: badgeTX }] }}>
                  <View
                    style={[styles.statusBadge, { backgroundColor: c.badgeBg }]}
                    accessibilityRole="image"
                    accessibilityLabel={`Estado ${subtitleMap[s]}`}
                  >
                    <Feather
                      name={s === "good" ? "shield" : badgeIconMap[s]}
                      size={24}
                      color={c.badgeColor}
                      accessible={false}
                    />
                  </View>
                </Animated.View>
                <Animated.View
                  style={{
                    opacity: buttonOpacity,
                    transform: [{ translateX: buttonTX }],
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={onCheckNotifications}
                    disabled={s === "good"}
                    style={[
                      styles.actionButton,
                      !isDark && { backgroundColor: btnBg },
                      {
                        shadowColor: btnBg,
                        borderWidth: 1.5,
                        borderColor: c.btnBorder,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Ver notificações"
                    accessibilityHint="Abre a lista de notificações."
                    accessibilityState={{ disabled: s === "good" }}
                  >
                    {isDark && (
                      <>
                        <BlurView
                          intensity={60}
                          tint="dark"
                          style={absoluteFill}
                        />
                        <View
                          style={[
                            absoluteFill,
                            {
                              backgroundColor: "rgba(0,0,0,0.5)",
                              borderRadius: 28,
                            },
                          ]}
                        />
                      </>
                    )}
                    <Text style={styles.actionButtonText}>
                      Ver Notificações
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 0,
    marginTop: 32,
    marginBottom: 12,
  },
  card: {
    borderRadius: 0,
    overflow: "hidden",
    position: "relative",
  },
  waveContainerTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    gap: 40,
  },
  titleContainer: {
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  cuidadoNameText: {
    fontFamily: "Safiro-Medium",
    fontSize: 34,
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 15,
    fontWeight: "400",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginTop: 16,
  },
  statusBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionButton: {
    height: 56,
    paddingHorizontal: 24,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
