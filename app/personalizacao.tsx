import BackButton from "@/components/buttons/backButton";
import LightBackground from "@/components/DotBackground";
import Navbar from "@/components/navBar/NavBar";
import { type ColorPaletteType } from "@/contexts/ThemeContext";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import temaClaro from "@/assets/images/tema_claro.png";
import temaEscuro from "@/assets/images/tema_escuro.png";
import { useTheme } from "@/hooks/useTheme";

type TabType = "temas" | "cores";
type ViewType = "detalhada" | "simplificada";

type ColorOption = {
  id: ColorPaletteType;
  title: string;
  subtitle: string;
  swatches: [string, string, string];
};

const COLOR_OPTIONS: ColorOption[] = [
  {
    id: "default",
    title: "Padrão",
    subtitle: "Verde, amarelo e vermelho tradicionais.",
    swatches: ["#4CD964", "#FFCC00", "#FF5151"],
  },
  {
    id: "deuteranopia",
    title: "Deuteranopia",
    subtitle: "Azul, laranja e magenta para reduzir confusão vermelho/verde.",
    swatches: ["#2D9CDB", "#F2994A", "#C445C2"],
  },
  {
    id: "protanopia",
    title: "Protanopia",
    subtitle: "Contraste alto entre tons frios e quentes.",
    swatches: ["#2D9CDB", "#F2C94C", "#9B51E0"],
  },
  {
    id: "tritanopia",
    title: "Tritanopia",
    subtitle: "Ajustado para diferenciar melhor azul e amarelo.",
    swatches: ["#27AE60", "#E67E22", "#D64550"],
  },
  {
    id: "highContrast",
    title: "Alto Contraste",
    subtitle: "Máxima separação para leitura rápida.",
    swatches: ["#0077FF", "#FF8A00", "#D40000"],
  },
];

const Personalizacao = () => {
  const { isDark, setTheme, colorPalette, setColorPalette, colors } =
    useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("temas");
  const [selectedView, setSelectedView] = useState<ViewType>("detalhada");

  // Animation values
  const themeAnimations = useRef({
    escuro: new Animated.Value(isDark ? 1 : 0),
    claro: new Animated.Value(isDark ? 0 : 1),
  }).current;

  const viewAnimations = useRef({
    detalhada: new Animated.Value(1),
    simplificada: new Animated.Value(0),
  }).current;

  // Sync animation with theme on mount
  useEffect(() => {
    themeAnimations.escuro.setValue(isDark ? 1 : 0);
    themeAnimations.claro.setValue(isDark ? 0 : 1);
  }, [isDark, themeAnimations.claro, themeAnimations.escuro]);

  const handleThemeChange = (theme: "escuro" | "claro") => {
    // Update global theme
    setTheme(theme === "escuro" ? "dark" : "light");

    Animated.parallel([
      Animated.timing(themeAnimations[theme], {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(
        themeAnimations[theme === "escuro" ? "claro" : "escuro"],
        {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        },
      ),
    ]).start();
  };

  const handleViewChange = (view: ViewType) => {
    setSelectedView(view);
    Animated.parallel([
      Animated.timing(viewAnimations[view], {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(
        viewAnimations[view === "detalhada" ? "simplificada" : "detalhada"],
        {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        },
      ),
    ]).start();
  };

  return (
    <LightBackground>
      <View className="flex-1">
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="px-4 pt-10 mb-4">
            <BackButton label="Personalização" dark={isDark} />
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            className="px-4"
          >
            {/* Tab Selector */}
            <View
              className="w-full h-[43px] rounded-[20px] mt-4 flex-row items-center relative px-[3px]"
              style={{
                backgroundColor: isDark
                  ? "rgba(80, 97, 255, 0.20)"
                  : "rgba(36.27, 58.39, 255, 0.20)",
                boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
              }}
            >
              {/* White background for selected tab */}
              <View
                className={`absolute h-[37px] flex-1 rounded-[20px] ${isDark ? "bg-aide-dark-card" : "bg-white"}`}
                style={{
                  left: activeTab === "temas" ? 3 : undefined,
                  right: activeTab === "cores" ? 3 : undefined,
                  width: "50%",
                  marginLeft: activeTab === "cores" ? "50%" : 0,
                  marginRight: activeTab === "temas" ? "50%" : 0,
                  boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.08)",
                }}
              />

              {/* Temas Tab */}
              <TouchableOpacity
                onPress={() => setActiveTab("temas")}
                className="flex-1 items-center justify-center z-10 py-2"
                accessibilityRole="button"
                accessibilityLabel="Separador temas"
                accessibilityState={{ selected: activeTab === "temas" }}
              >
                <Text
                  className={`text-[20px] font-open-sans-semibold ${
                    activeTab === "temas"
                      ? isDark
                        ? "text-white"
                        : "text-black"
                      : isDark
                        ? "text-white/70"
                        : "text-black/70"
                  }`}
                >
                  Temas
                </Text>
              </TouchableOpacity>

              {/* Cores Tab */}
              <TouchableOpacity
                onPress={() => setActiveTab("cores")}
                className="flex-1 items-center justify-center z-10 py-2"
                accessibilityRole="button"
                accessibilityLabel="Separador cores"
                accessibilityState={{ selected: activeTab === "cores" }}
              >
                <Text
                  className={`text-[20px] font-open-sans-semibold ${
                    activeTab === "cores"
                      ? isDark
                        ? "text-white"
                        : "text-black"
                      : isDark
                        ? "text-white/70"
                        : "text-black/70"
                  }`}
                >
                  Cores
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === "temas" && (
              <>
                {/* Theme Selection Cards */}
                <View className="flex-row gap-4 mt-6">
                  {/* Escuro Card */}
                  <TouchableOpacity
                    onPress={() => handleThemeChange("escuro")}
                    activeOpacity={0.9}
                    className="flex-1 h-[249px] rounded-[40px] overflow-hidden border-2"
                    accessibilityRole="button"
                    accessibilityLabel="Tema escuro"
                    accessibilityHint="Aplica o tema escuro."
                    accessibilityState={{ selected: isDark }}
                    style={{
                      borderColor: isDark ? "#5061FF" : "transparent",
                    }}
                  >
                    <Animated.View
                      style={{
                        flex: 1,
                        backgroundColor: themeAnimations.escuro.interpolate({
                          inputRange: [0, 1],
                          outputRange: [
                            isDark ? "rgba(0, 4, 18, 0.9)" : "white",
                            "rgba(124.49, 137.17, 255, 0.40)",
                          ],
                        }),
                        boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
                        alignItems: "center",
                      }}
                    >
                      <Image
                        source={temaEscuro}
                        className="w-[134px] h-[184px] rounded-[25px] mt-3"
                        resizeMode="contain"
                        accessible={false}
                      />
                      <View className="flex-1 justify-center">
                        <Text
                          className={`text-[20px] font-open-sans text-center ${isDark ? "text-white" : "text-black"}`}
                        >
                          Escuro
                        </Text>
                      </View>
                    </Animated.View>
                  </TouchableOpacity>

                  {/* Claro Card */}
                  <TouchableOpacity
                    onPress={() => handleThemeChange("claro")}
                    activeOpacity={0.9}
                    className="flex-1 h-[249px] rounded-[40px] overflow-hidden border-2"
                    accessibilityRole="button"
                    accessibilityLabel="Tema claro"
                    accessibilityHint="Aplica o tema claro."
                    accessibilityState={{ selected: !isDark }}
                    style={{
                      borderColor: !isDark ? "#5061FF" : "transparent",
                    }}
                  >
                    <Animated.View
                      style={{
                        flex: 1,
                        backgroundColor: themeAnimations.claro.interpolate({
                          inputRange: [0, 1],
                          outputRange: [
                            isDark ? "rgba(0, 4, 18, 0.9)" : "white",
                            "rgba(124.49, 137.17, 255, 0.40)",
                          ],
                        }),
                        boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
                        alignItems: "center",
                      }}
                    >
                      <Image
                        source={temaClaro}
                        className="w-[134px] h-[184px] rounded-[25px] mt-3"
                        resizeMode="contain"
                        accessible={false}
                      />
                      <View className="flex-1 justify-center">
                        <Text
                          className={`text-[20px] font-open-sans text-center ${isDark ? "text-white" : "text-black"}`}
                        >
                          Claro
                        </Text>
                      </View>
                    </Animated.View>
                  </TouchableOpacity>
                </View>

                {/* Vista Section */}
                <Text
                  className={`text-[24px] font-safiro mt-6 mb-4 ${isDark ? "text-white" : "text-black"}`}
                >
                  Vista
                </Text>

                {/* Visualização Detalhada Card */}
                <TouchableOpacity
                  onPress={() => handleViewChange("detalhada")}
                  activeOpacity={0.9}
                  className="w-full h-[187px] rounded-[20px] overflow-hidden mb-4 border-2"
                  accessibilityRole="button"
                  accessibilityLabel="Visualização detalhada"
                  accessibilityHint="Mostra valores exatos e gráficos detalhados."
                  accessibilityState={{
                    selected: selectedView === "detalhada",
                  }}
                  style={{
                    borderColor:
                      selectedView === "detalhada" ? "#5061FF" : "transparent",
                  }}
                >
                  <Animated.View
                    style={{
                      flex: 1,
                      padding: 16,
                      backgroundColor: viewAnimations.detalhada.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          isDark ? "rgba(0, 4, 18, 0.9)" : "white",
                          "rgba(124.49, 137.17, 255, 0.10)",
                        ],
                      }),
                      boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
                    }}
                  >
                    <View className="flex-row items-center gap-2">
                      <View className="w-[24px] h-[24px] items-center justify-center">
                        <View
                          className={`w-[18px] h-[16px] ${isDark ? "bg-white" : "bg-black"}`}
                        />
                      </View>
                      <Text
                        className={`text-[14px] font-open-sans-semibold ${isDark ? "text-white" : "text-black"}`}
                      >
                        Visualização Detalhada
                      </Text>
                    </View>
                    <Text
                      className={`text-[14px] font-open-sans mt-2 ${isDark ? "text-white/60" : "text-black/60"}`}
                    >
                      Representação dos valores exatos e gráficos detalhados
                    </Text>

                    {/* Sample Chart */}
                    <View
                      className="w-[137px] h-[71px] rounded-[20px] mt-3 p-2"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(0, 4, 18, 0.9)"
                          : "white",
                        boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
                      }}
                    >
                      <View
                        className="w-[115px] h-[43px] rounded-lg"
                        style={{ backgroundColor: colors.semantic.success }}
                      />
                    </View>
                  </Animated.View>
                </TouchableOpacity>

                {/* Visualização Simplificada Card */}
                <TouchableOpacity
                  onPress={() => handleViewChange("simplificada")}
                  activeOpacity={0.9}
                  className="w-full h-[187px] rounded-[20px] overflow-hidden border-2"
                  accessibilityRole="button"
                  accessibilityLabel="Visualização simplificada"
                  accessibilityHint="Mostra intervalos e linguagem mais acessível."
                  accessibilityState={{
                    selected: selectedView === "simplificada",
                  }}
                  style={{
                    borderColor:
                      selectedView === "simplificada"
                        ? "#5061FF"
                        : "transparent",
                  }}
                >
                  <Animated.View
                    style={{
                      flex: 1,
                      padding: 16,
                      backgroundColor: viewAnimations.simplificada.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          isDark ? "rgba(0, 4, 18, 0.9)" : "white",
                          "rgba(124.49, 137.17, 255, 0.10)",
                        ],
                      }),
                      boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
                    }}
                  >
                    <View className="flex-row items-center gap-2">
                      <View className="w-[24px] h-[24px] items-center justify-center">
                        <View
                          className={`w-[18px] h-[16px] ${isDark ? "bg-white" : "bg-black"}`}
                        />
                      </View>
                      <Text
                        className={`text-[14px] font-open-sans-semibold ${isDark ? "text-white" : "text-black"}`}
                      >
                        Visualização Simplificada
                      </Text>
                    </View>
                    <Text
                      className={`text-[14px] font-open-sans mt-2 ${isDark ? "text-white/60" : "text-black/60"}`}
                    >
                      Representação dos valores em intervalos e linguagem mais
                      acessível
                    </Text>

                    {/* Sample Widget */}
                    <View
                      className="w-[144px] h-[75px] rounded-[11px] p-3 mt-3"
                      style={{
                        backgroundColor: "rgba(76, 217, 100, 0.40)",
                        boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
                      }}
                    >
                      <View className="flex-row items-center gap-1">
                        <View
                          className={`w-[9px] h-[12px] ${isDark ? "bg-white/80" : "bg-black/80"}`}
                        />
                        <Text
                          className={`text-[12px] font-open-sans-semibold ${isDark ? "text-white/80" : "text-black/80"}`}
                        >
                          Glicose
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2 mt-2">
                        <View
                          className={`w-[14px] h-[14px] rounded-full border ${isDark ? "border-white/60" : "border-black/60"}`}
                        />
                        <View
                          className={`w-[6px] h-[2px] ${isDark ? "bg-white/60" : "bg-black/60"}`}
                        />
                        <Text
                          className={`text-[14px] font-open-sans-semibold ${isDark ? "text-white/60" : "text-black/60"}`}
                        >
                          normal
                        </Text>
                      </View>
                      <View className="w-full h-[4px] rounded-[3px] bg-[#F6F6F6] mt-2">
                        <View
                          className="w-[70%] h-[4px] rounded-[3px]"
                          style={{ backgroundColor: colors.semantic.success }}
                        />
                      </View>
                    </View>
                  </Animated.View>
                </TouchableOpacity>
              </>
            )}

            {activeTab === "cores" && (
              <>
                <Text
                  className={`text-[24px] font-safiro mt-6 mb-2 ${isDark ? "text-white" : "text-black"}`}
                >
                  Paleta Acessivel
                </Text>
                <Text
                  className={`text-[14px] font-open-sans mb-4 ${isDark ? "text-white/70" : "text-black/70"}`}
                >
                  Escolha uma combinacao de cores com melhor distinguibilidade
                  para diferentes tipos de daltonismo.
                </Text>

                {COLOR_OPTIONS.map((option) => {
                  const isSelected = colorPalette === option.id;

                  return (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => setColorPalette(option.id)}
                      activeOpacity={0.9}
                      className="w-full rounded-[20px] p-4 mb-3 border-2"
                      accessibilityRole="button"
                      accessibilityLabel={`${option.title}. ${option.subtitle}`}
                      accessibilityHint="Aplica esta paleta de cores."
                      accessibilityState={{ selected: isSelected }}
                      style={{
                        borderColor: isSelected ? "#5061FF" : "transparent",
                        backgroundColor: isDark
                          ? "rgba(0, 4, 18, 0.9)"
                          : "rgba(255, 255, 255, 0.9)",
                        boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
                      }}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 pr-2">
                          <Text
                            className={`text-[18px] font-open-sans-semibold ${isDark ? "text-white" : "text-black"}`}
                          >
                            {option.title}
                          </Text>
                          <Text
                            className={`text-[13px] font-open-sans mt-1 ${isDark ? "text-white/70" : "text-black/70"}`}
                          >
                            {option.subtitle}
                          </Text>
                        </View>
                        {isSelected && (
                          <Text className="text-[12px] font-open-sans-semibold text-[#5061FF]">
                            Selecionada
                          </Text>
                        )}
                      </View>

                      <View className="flex-row gap-2 mt-3">
                        {option.swatches.map((swatchColor) => (
                          <View
                            key={`${option.id}-${swatchColor}`}
                            className="w-[34px] h-[34px] rounded-full border"
                            style={{
                              backgroundColor: swatchColor,
                              borderColor: isDark
                                ? "rgba(255, 255, 255, 0.25)"
                                : "rgba(0, 0, 0, 0.12)",
                            }}
                          />
                        ))}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </ScrollView>

          {/* Bottom Navigation */}
          <Navbar dark={isDark} />
        </SafeAreaView>
      </View>
    </LightBackground>
  );
};

export default Personalizacao;
