import BackButton from "@/components/buttons/backButton";
import Navbar from "@/components/navBar/NavBar";
import LightBackground from "@/components/DotBackground";
import React, { useRef, useState, useEffect } from "react";
import {
  Animated,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import temaClaro from "@/assets/images/tema_claro.png";
import temaEscuro from "@/assets/images/tema_escuro.png";
import { useTheme } from "@/hooks/useTheme";

type TabType = "temas" | "cores";
type ViewType = "detalhada" | "simplificada";

const Personalizacao = () => {
  const { isDark, setTheme } = useTheme();
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
  }, []);

  const handleThemeChange = (theme: "escuro" | "claro") => {
    // Update global theme
    setTheme(theme === "escuro" ? "dark" : "light");
    
    Animated.parallel([
      Animated.timing(themeAnimations[theme], {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(themeAnimations[theme === "escuro" ? "claro" : "escuro"], {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
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
      Animated.timing(viewAnimations[view === "detalhada" ? "simplificada" : "detalhada"], {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  return (
    <LightBackground>
      <View className="flex-1">
        <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-4 pt-10">
          <BackButton label="Personalização" dark={!isDark} />
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
                boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.08)" 
              }}
            />

            {/* Temas Tab */}
            <TouchableOpacity
              onPress={() => setActiveTab("temas")}
              className="flex-1 items-center justify-center z-10 py-2"
            >
              <Text
                className={`text-[20px] font-open-sans-semibold ${activeTab === "temas" 
                  ? (isDark ? "text-white" : "text-black") 
                  : (isDark ? "text-white/70" : "text-black/70")}`}
              >
                Temas
              </Text>
            </TouchableOpacity>

            {/* Cores Tab */}
            <TouchableOpacity
              onPress={() => setActiveTab("cores")}
              className="flex-1 items-center justify-center z-10 py-2"
            >
              <Text
                className={`text-[20px] font-open-sans-semibold ${activeTab === "cores" 
                  ? (isDark ? "text-white" : "text-black") 
                  : (isDark ? "text-white/70" : "text-black/70")}`}
              >
                Cores
              </Text>
            </TouchableOpacity>
          </View>

          {/* Theme Selection Cards */}
          <View className="flex-row gap-4 mt-6">
            {/* Escuro Card */}
            <TouchableOpacity
              onPress={() => handleThemeChange("escuro")}
              activeOpacity={0.9}
              className="flex-1 h-[249px] rounded-[40px] overflow-hidden border-2"
              style={{
                borderColor: isDark ? "#5061FF" : "transparent",
              }}
            >
              <Animated.View
                style={{
                  flex: 1,
                  backgroundColor: themeAnimations.escuro.interpolate({
                    inputRange: [0, 1],
                    outputRange: [isDark ? "rgba(0, 4, 18, 0.9)" : "white", "rgba(124.49, 137.17, 255, 0.40)"],
                  }),
                  boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
                  alignItems: "center",
                }}
              >
                <Image
                  source={temaEscuro}
                  className="w-[134px] h-[184px] rounded-[25px] mt-3"
                  resizeMode="contain"
                />
                <View className="flex-1 justify-center">
                  <Text className={`text-[20px] font-open-sans text-center ${isDark ? "text-white" : "text-black"}`}>
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
              style={{
                borderColor: !isDark ? "#5061FF" : "transparent",
              }}
            >
              <Animated.View
                style={{
                  flex: 1,
                  backgroundColor: themeAnimations.claro.interpolate({
                    inputRange: [0, 1],
                    outputRange: [isDark ? "rgba(0, 4, 18, 0.9)" : "white", "rgba(124.49, 137.17, 255, 0.40)"],
                  }),
                  boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
                  alignItems: "center",
                }}
              >
                <Image
                  source={temaClaro}
                  className="w-[134px] h-[184px] rounded-[25px] mt-3"
                  resizeMode="contain"
                />
                <View className="flex-1 justify-center">
                  <Text className={`text-[20px] font-open-sans text-center ${isDark ? "text-white" : "text-black"}`}>
                    Claro
                  </Text>
                </View>
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Vista Section */}
          <Text className={`text-[24px] font-safiro mt-6 mb-4 ${isDark ? "text-white" : "text-black"}`}>
            Vista
          </Text>

          {/* Visualização Detalhada Card */}
          <TouchableOpacity
            onPress={() => handleViewChange("detalhada")}
            activeOpacity={0.9}
            className="w-full h-[187px] rounded-[20px] overflow-hidden mb-4 border-2"
            style={{
              borderColor: selectedView === "detalhada" ? "#5061FF" : "transparent",
            }}
          >
            <Animated.View
              style={{
                flex: 1,
                padding: 16,
                backgroundColor: viewAnimations.detalhada.interpolate({
                  inputRange: [0, 1],
                  outputRange: [isDark ? "rgba(0, 4, 18, 0.9)" : "white", "rgba(124.49, 137.17, 255, 0.10)"],
                }),
                boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
              }}
            >
              <View className="flex-row items-center gap-2">
                <View className="w-[24px] h-[24px] items-center justify-center">
                  <View className={`w-[18px] h-[16px] ${isDark ? "bg-white" : "bg-black"}`} />
                </View>
                <Text className={`text-[14px] font-open-sans-semibold ${isDark ? "text-white" : "text-black"}`}>
                  Visualização Detalhada
                </Text>
              </View>
              <Text className={`text-[14px] font-open-sans mt-2 ${isDark ? "text-white/60" : "text-black/60"}`}>
                Representação dos valores exatos e gráficos detalhados
              </Text>

              {/* Sample Chart */}
              <View
                className="w-[137px] h-[71px] rounded-[20px] mt-3 p-2"
                style={{ 
                  backgroundColor: isDark ? "rgba(0, 4, 18, 0.9)" : "white",
                  boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" 
                }}
              >
                <View
                  className="w-[115px] h-[43px] rounded-lg"
                  style={{ backgroundColor: "#4CD964" }}
                />
              </View>
            </Animated.View>
          </TouchableOpacity>

          {/* Visualização Simplificada Card */}
          <TouchableOpacity
            onPress={() => handleViewChange("simplificada")}
            activeOpacity={0.9}
            className="w-full h-[187px] rounded-[20px] overflow-hidden border-2"
            style={{
              borderColor: selectedView === "simplificada" ? "#5061FF" : "transparent",
            }}
          >
            <Animated.View
              style={{
                flex: 1,
                padding: 16,
                backgroundColor: viewAnimations.simplificada.interpolate({
                  inputRange: [0, 1],
                  outputRange: [isDark ? "rgba(0, 4, 18, 0.9)" : "white", "rgba(124.49, 137.17, 255, 0.10)"],
                }),
                boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
              }}
            >
            <View className="flex-row items-center gap-2">
              <View className="w-[24px] h-[24px] items-center justify-center">
                <View className={`w-[18px] h-[16px] ${isDark ? "bg-white" : "bg-black"}`} />
              </View>
              <Text className={`text-[14px] font-open-sans-semibold ${isDark ? "text-white" : "text-black"}`}>
                Visualização Simplificada
              </Text>
            </View>
            <Text className={`text-[14px] font-open-sans mt-2 ${isDark ? "text-white/60" : "text-black/60"}`}>
              Representação dos valores em intervalos e linguagem mais acessível
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
                <View className={`w-[9px] h-[12px] ${isDark ? "bg-white/80" : "bg-black/80"}`} />
                <Text className={`text-[12px] font-open-sans-semibold ${isDark ? "text-white/80" : "text-black/80"}`}>
                  Glicose
                </Text>
              </View>
              <View className="flex-row items-center gap-2 mt-2">
                <View className={`w-[14px] h-[14px] rounded-full border ${isDark ? "border-white/60" : "border-black/60"}`} />
                <View className={`w-[6px] h-[2px] ${isDark ? "bg-white/60" : "bg-black/60"}`} />
                <Text className={`text-[14px] font-open-sans-semibold ${isDark ? "text-white/60" : "text-black/60"}`}>
                  normal
                </Text>
              </View>
              <View className="w-full h-[4px] rounded-[3px] bg-[#F6F6F6] mt-2">
                <View className="w-[70%] h-[4px] rounded-[3px] bg-aide-green" />
              </View>
            </View>
            </Animated.View>
          </TouchableOpacity>
        </ScrollView>

        {/* Bottom Navigation */}
        <Navbar dark={isDark} />
      </SafeAreaView>
    </View>
  </LightBackground>
  );
};

export default Personalizacao;