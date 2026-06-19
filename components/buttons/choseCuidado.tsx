import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import ArrowIcon from "../svg/ArrowIcon";
import { useTheme } from "@/hooks/useTheme";

interface Cuidado {
  id: string;
  name: string;
}

interface ChoseCuidadoProps {
  cuidados: Cuidado[];
  selectedCuidado?: Cuidado;
  onSelect: (cuidado: Cuidado) => void;
  className?: string;
}

export const ChoseCuidado = ({
  cuidados,
  selectedCuidado,
  onSelect,
  className,
}: ChoseCuidadoProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownHeight = useSharedValue(0);
  const { isDark } = useTheme();

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    dropdownHeight.value = withTiming(isOpen ? 0 : cuidados.length * 52, {
      duration: 200,
    });
  };

  const handleSelect = (cuidado: Cuidado) => {
    onSelect(cuidado);
    setIsOpen(false);
    dropdownHeight.value = withTiming(0, { duration: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    height: dropdownHeight.value,
    overflow: "hidden",
  }));

  const dropdownLayerStyle = isOpen
    ? { zIndex: 2000, elevation: 2000 }
    : { zIndex: 50, elevation: 50 };

  return (
    <View
      className={`w-full ${className}`}
      style={[
        {
          position: "relative",
          overflow: "visible",
        },
        dropdownLayerStyle,
      ]}
    >
      {/* Placeholder to maintain layout height */}
      <View className="w-full flex-row items-center justify-center px-6 py-3 opacity-0">
        <Text
          className="mr-2 flex-shrink text-xl font-semibold"
          numberOfLines={1}
        >
          {selectedCuidado?.name ?? "Selecionar"}
        </Text>
        <ArrowIcon variant="DOWN" dark={isDark} size={20} />
      </View>

      {/* Actual expanding component */}
      <View
        className="absolute top-0 left-0 right-0 rounded-[30px]"
        style={[
          {
            boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
            overflow: "visible",
          },
          dropdownLayerStyle,
        ]}
      >
        <View
          className={`rounded-[30px] overflow-hidden ${isDark ? "bg-[#131632]" : "bg-white"}`}
        >
          <TouchableOpacity
            onPress={toggleDropdown}
            className="w-full flex-row items-center justify-center px-6 py-3"
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={selectedCuidado?.name ?? "Selecionar cuidado"}
            accessibilityHint={
              isOpen
                ? "Fecha a lista de cuidados."
                : "Abre a lista de cuidados disponíveis."
            }
            accessibilityState={{ expanded: isOpen }}
          >
            <Text
              className={`mr-2 flex-shrink text-xl font-semibold ${isDark ? "text-white" : "text-[#111111]"}`}
              numberOfLines={1}
            >
              {selectedCuidado?.name ?? "Selecionar"}
            </Text>
            <ArrowIcon
              variant={isOpen ? "UP" : "DOWN"}
              dark={isDark}
              size={20}
            />
          </TouchableOpacity>

          <Animated.View style={animatedStyle}>
            {cuidados.map((cuidado, index) => (
              <TouchableOpacity
                key={cuidado.id}
                onPress={() => handleSelect(cuidado)}
                activeOpacity={0.7}
                className={`px-6 py-3 ${index < cuidados.length - 1 ? (isDark ? "border-b border-white/10" : "border-b border-[#5061FF]/10") : ""} ${selectedCuidado?.id === cuidado.id ? (isDark ? "bg-blue-900/50" : "bg-[#5061FF]/10") : ""}`}
                accessibilityRole="button"
                accessibilityLabel={cuidado.name}
                accessibilityHint="Seleciona este cuidado."
                accessibilityState={{
                  selected: selectedCuidado?.id === cuidado.id,
                }}
              >
                <Text
                  className={`text-center text-lg font-medium ${selectedCuidado?.id === cuidado.id ? (isDark ? "text-blue-300" : "text-[#5061FF]") : isDark ? "text-white" : "text-[#111111]"}`}
                  numberOfLines={1}
                >
                  {cuidado.name}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

export default ChoseCuidado;
