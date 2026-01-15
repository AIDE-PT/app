import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  title: string;
  onPress: () => void;
}

const ElementoDefinicao = ({ title, onPress }: Props) => {
  return (
    <View className="mb-4 w-full">
      {/* Container branco puro com sombra leve */}
      <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <TouchableOpacity
          onPress={onPress}
          className="p-3 bg-white/90 items-start"
        >
          <Text className="font-open-sans text-[16px] mx-2 text-black/90 text-left">
            {title}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ElementoDefinicao;
