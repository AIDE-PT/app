import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ProfileImage } from "./profileimage";

const AnimatedCard = Animated.createAnimatedComponent(TouchableOpacity);

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
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: isSelected ? 1.02 : 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [isSelected]);

  const isFaded = isOtherSelected && !isSelected;

  return (
    <AnimatedCard
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        styles.cardContainer,
        {
          transform: [{ scale }],
          opacity: isFaded ? 0.35 : 1,
        },
        isSelected ? styles.selectedBorder : styles.unselectedBorder,
      ]}
    >
      {/* O Gradiente agora preenche o fundo respeitando o border radius */}
      {isSelected && (
        <LinearGradient
          colors={["#F1F7FF", "#9DBFFF"]}
          style={StyleSheet.absoluteFill}
        />
      )}

      <View className="flex-1 p-5">
        {/* 1. Imagem no topo: Ocupa 65% do card para não bater no texto */}
        <View style={{ height: "65%" }}>
          <ProfileImage source={imageSource} />
        </View>

        {/* 2. Conteúdo de Texto: Ocupa os 35% inferiores */}
        <View style={{ height: "35%" }} className="justify-end pb-2">
          <View className="flex-row items-center mb-1">
            <Image
              source={iconSource}
              className="w-6 h-6"
              resizeMode="contain"
            />
            <Text
              className={`font-bold text-xl ml-2 ${isSelected ? "text-black" : "text-[#BCBCBC]"}`}
            >
              {title}
            </Text>
          </View>

          {isSelected && (
            <Text className="text-gray-800 text-[11px] leading-4 font-medium">
              {description}
            </Text>
          )}
        </View>
      </View>
    </AnimatedCard>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    minHeight: 380, // Mantém a altura do design
    borderRadius: 40,
    overflow: "hidden", // Crucial para o gradiente e imagem não saírem fora
    backgroundColor: "white",
  },
  selectedBorder: {
    borderWidth: 2,
    borderColor: "#4B6BFF",
  },
  unselectedBorder: {
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
});
