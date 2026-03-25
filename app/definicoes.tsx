import { router } from "expo-router";
import React from "react";
import { SafeAreaView, View } from "react-native";
import BackButton from "../components/buttons/backButton";
import DefinicoesLista from "../components/definicoes_lista";
import LightBackground from "@/components/DotBackground";
import { useTheme } from "@/hooks/useTheme";

const Definicoes = () => {
  const { isDark } = useTheme();

  return (
    <LightBackground>
      <View className="flex-1 px-4 pt-10">
        <SafeAreaView className="flex-1">
          <BackButton
            label="Definições"
            dark={isDark}
            onPress={() => router.push("/testDashboard")}
          />

          <DefinicoesLista />
        </SafeAreaView>
      </View>
    </LightBackground>
  );
};

export default Definicoes;
