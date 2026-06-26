import LightBackground from "@/components/DotBackground";
import { useTheme } from "@/hooks/useTheme";
import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "../components/buttons/backButton";
import DefinicoesLista from "../components/definicoes_lista";

const Definicoes = () => {
  const { isDark } = useTheme();

  return (
    <LightBackground>
      <View className="flex-1 px-4 pt-10">
        <SafeAreaView className="flex-1">
          <View className="mb-4">
            <BackButton
              label="Definições"
              dark={isDark}
              onPress={() => router.push("/testDashboard")}
            />
          </View>

          <DefinicoesLista />
        </SafeAreaView>
      </View>
    </LightBackground>
  );
};

export default Definicoes;
