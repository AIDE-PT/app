import React from "react";
import { View, Text } from "react-native";
import { Info } from "lucide-react-native";
import { Input } from "./input/Input"; // Caminho para o teu ficheiro Input.tsx

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
  return (
    <View className="mb-4 w-full">
      {/* mb-4 = 16px de espaçamento vertical */}
      <View className="flex-row items-center mb-2 ml-1">
        <Text className="text-black font-bold text-base mr-2">{label}</Text>
        <Info size={16} color="black" />
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
