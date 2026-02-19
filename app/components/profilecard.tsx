import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ProfileImage } from "./profileimage";
import { useTheme } from "@/hooks/useTheme";

interface ProfileCardProps {
  title: string;
  description: string;
  imageSource: any;
  iconSource: any;
  isSelected: boolean;
  isOtherSelected: boolean;
  onPress: () => void;
}

export const Profilecard = ({
  title,
  description,
  imageSource,
  iconSource,
  isSelected,
  isOtherSelected,
  onPress,
}: ProfileCardProps) => {
  const isFaded = isOtherSelected && !isSelected;
  const { isDark } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        styles.cardContainer,
        {
          opacity: isFaded ? 0.6 : 1,
          backgroundColor: isDark ? "rgba(0, 4, 18, 0.9)" : "white",
        },
        isSelected ? styles.selectedBorder : styles.unselectedBorder,
      ]}
    >
      <View className="flex-1 p-5">
        {/* 1. Imagem no topo: Ocupa 65% do card para não bater no texto */}
        <View style={{ height: "65%" }}>
          <ProfileImage source={imageSource} />
        </View>

        {/* 2. Conteúdo de Texto: Ocupa os 35% inferiores */}
        <View
          style={{ height: "35%", position: "relative" }}
          className="justify-end pb-2"
        >
          {/* Gradient overlay behind title and description */}
          {isSelected && (
            <LinearGradient
              colors={[
                "transparent",
                "rgba(124, 137, 255, 0.25)",
                "rgba(124, 137, 255, 0.5)",
              ]}
              locations={[0, 0.3, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[
                StyleSheet.absoluteFill,
                { marginHorizontal: -20, marginBottom: -20 },
              ]}
            />
          )}
          <View className="flex-row items-center mb-1">
            <Image
              source={iconSource}
              className="w-6 h-6"
              resizeMode="contain"
            />
            <Text
              className={`font-bold text-xl ml-2 ${isSelected ? (isDark ? "text-white" : "text-black") : "text-[#6B7280]"}`}
            >
              {title}
            </Text>
          </View>

          <Text
            className={`text-[16px] ${isDark ? "text-white/80" : "text-gray-800"}`}
            style={{ opacity: isSelected ? 1 : 0 }}
          >
            {description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    minHeight: 380, // Mantém a altura do design
    borderRadius: 40,
    overflow: "hidden", // Crucial para o gradiente e imagem não saírem fora
  },
  selectedBorder: {
    borderWidth: 2,
    borderColor: "#0400FF",
  },
  unselectedBorder: {
    borderWidth: 2,
    borderColor: "transparent",
    boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
  },
});
