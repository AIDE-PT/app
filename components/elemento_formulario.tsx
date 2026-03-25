import React from "react";
import { View, Text } from "react-native";
import { Info } from "lucide-react-native";
import { Input } from "./input/Input";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  editable: boolean;
  type?: "text" | "password" | "date" | "email";
}

const ElementoFormulario = ({
  label,
  value,
  onChangeText,
  editable,
  type = "text",
}: Props) => {
  const { isDark } = useTheme();

  return (
    <View className="mb-4 w-full">
      <View className="flex-row items-center mb-2 ml-1">
        <Text
          className={`font-bold text-base mr-2 ${isDark ? "text-white" : "text-black"}`}
        >
          {label}
        </Text>
        <Info size={16} color={isDark ? "white" : "black"} />
      </View>
      <Input
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        type={type}
        variant="light"
      />
    </View>
  );
};

export default ElementoFormulario;
