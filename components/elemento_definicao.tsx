import React from "react";
import { View } from "react-native";
// Caminho correto a partir da pasta components
import { Button } from "./buttons/button";

interface Props {
  title: string;
  onPress: () => void;
}

const ElementoDefinicao = ({ title, onPress }: Props) => {
  return (
    <View className="mb-4 w-full px-6">
      {/* Container branco puro com sombra leve */}
      <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Button label={title} onPress={onPress} variant="list" />
      </View>
    </View>
  );
};

export default ElementoDefinicao;
