import { useFonts } from "expo-font";
import { router } from "expo-router";
import React from "react";
import { SafeAreaView, View } from "react-native";
import BackButton from "../components/buttons/backButton";
import DefinicoesLista from "../components/definicoes_lista";

const Definicoes = () => {
  const [fontsLoaded] = useFonts({
    "Safiro-Medium": require("../assets/fonts/safiro/safiro-medium-webfont.ttf"),
    "OpenSans-Regular": require("../assets/fonts/open-sans/OpenSans-Regular.ttf"),
    "OpenSans-SemiBold": require("../assets/fonts/open-sans/OpenSans-SemiBold.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }
  return (
    <View className="flex-1 px-4 pt-10 bg-aide-background">
      <SafeAreaView className="flex-1">
        <BackButton
          label="Histórico Diário"
          dark
          onPress={() => router.push("/testDashboard")}
        />

        <DefinicoesLista />
      </SafeAreaView>
    </View>
  );
};

export default Definicoes;
