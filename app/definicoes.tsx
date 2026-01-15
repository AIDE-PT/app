import React from "react";
import { View, ScrollView, SafeAreaView } from "react-native";
import BackButton from "../components/buttons/backButton";
import DefinicoesLista from "../components/definicoes_lista";

const Definicoes = () => {
  return (
    <SafeAreaView className="flex-1 bg-[#F5F9FF]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-6 py-8">
          <BackButton label="Definições" />
        </View>

        <DefinicoesLista />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Definicoes;
