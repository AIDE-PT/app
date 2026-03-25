import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  title: string;
  onPress: () => void;
}

const ElementoDefinicao = ({ title, onPress }: Props) => {
  const { isDark } = useTheme();

  return (
    <View className="mb-4 w-full">
      {/* Container branco puro com sombra igual aos cards do dashboard */}
      <View
        className={`rounded-[20px] border overflow-hidden ${isDark ? "bg-aide-dark-card border-white/10" : "bg-white border-gray-100"}`}
        style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
      >
        <TouchableOpacity
          onPress={onPress}
          className={`p-3 items-start ${isDark ? "bg-transparent" : "bg-white/90"}`}
        >
          <Text
            className={`font-open-sans text-[16px] mx-2 text-left ${isDark ? "text-white/90" : "text-black/90"}`}
          >
            {title}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ElementoDefinicao;
