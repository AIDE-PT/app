import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
  const [isVisible, setIsVisible] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const { isDark } = useTheme();

  const openDropdown = () => {
    setIsVisible(true);
    setIsOpen(true);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      Animated.spring(dropdownAnim, {
        toValue: 1,
        tension: 100,
        friction: 12,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        if (!isOpen) {
          setIsVisible(false);
        }
      });
    }
  }, [isOpen]);

  const dropdownTranslateY = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });

  const dropdownScale = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  const dropdownOpacity = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const handleSelect = (cuidado: Cuidado) => {
    onSelect(cuidado);
    closeDropdown();
  };

  return (
    <View className="z-50">
      <TouchableOpacity
        onPress={() => (isOpen ? closeDropdown() : openDropdown())}
        style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
        className={`flex-row rounded-[30px] py-3 px-6 items-center justify-center z-50 ${isDark ? "bg-[#131632]" : "bg-white"} ${className}`}
        activeOpacity={0.8}
      >
        <Text className={`text-xl font-semibold mr-2 ${isDark ? "text-white" : "text-[#111111]"}`}>
          {selectedCuidado?.name ?? "Selecionar"}
        </Text>
        <ArrowIcon variant={isOpen ? "UP" : "DOWN"} dark={isDark} size={20} />
      </TouchableOpacity>

      {isVisible && (
        <>
          <Pressable
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 30 }}
            onPress={closeDropdown}
          />
          <Animated.View
            style={{
              opacity: dropdownOpacity,
              transform: [{ translateY: dropdownTranslateY }, { scale: dropdownScale }],
              boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
              backgroundColor: isDark ? "rgba(0, 4, 18, 0.95)" : "white",
              borderRadius: 20,
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: 4,
              zIndex: 40,
            }}
            className="px-6 py-4 overflow-hidden"
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {cuidados.map((cuidado, index) => (
                <View key={cuidado.id}>
                  <TouchableOpacity
                    onPress={() => handleSelect(cuidado)}
                    activeOpacity={0.7}
                    className="py-3 items-center"
                  >
                    <Text className={`text-lg font-medium ${isDark ? "text-white" : "text-[#111111]"}`}>
                      {cuidado.name}
                    </Text>
                  </TouchableOpacity>
                  {index < cuidados.length - 1 && (
                    <View className={`h-[1px] ${isDark ? "bg-white/10" : "bg-[#E5E5E5]"}`} />
                  )}
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        </>
      )}
    </View>
  );
};

export default ChoseCuidado;
