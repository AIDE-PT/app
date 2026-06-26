import { useTheme } from "@/hooks/useTheme";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import BottomModal from "./BottomModal";

interface Cuidado {
  id: string;
  name: string;
}

interface CuidadoModalProps {
  visible: boolean;
  onClose: () => void;
  cuidados: Cuidado[];
  onSelect: (cuidado: Cuidado) => void;
}

export default function CuidadoModal({
  visible,
  onClose,
  cuidados,
  onSelect,
}: CuidadoModalProps) {
  const { isDark } = useTheme();

  return (
    <BottomModal visible={visible} onClose={onClose}>
      <Text
        className={`text-base font-semibold mb-5 ${isDark ? "text-white" : "text-slate-900"}`}
      >
        Selecionar paciente
      </Text>
      {cuidados.map((cuidado, index) => (
        <View key={cuidado.id}>
          <TouchableOpacity
            onPress={() => {
              onSelect(cuidado);
              onClose();
            }}
            activeOpacity={0.7}
            className="py-4 items-center"
          >
            <Text
              className={`text-xl font-semibold ${isDark ? "text-white" : "text-[#111111]"}`}
            >
              {cuidado.name}
            </Text>
          </TouchableOpacity>
          {index < cuidados.length - 1 && (
            <View
              className={`h-[1px] ${isDark ? "bg-white/10" : "bg-[#E5E5E5]"}`}
            />
          )}
        </View>
      ))}
    </BottomModal>
  );
}
