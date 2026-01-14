import React from "react";
import { Image, ImageSourcePropType, View } from "react-native";

interface ProfileImageProps {
  source: ImageSourcePropType;
}

export const ProfileImage = ({ source }: ProfileImageProps) => (
  // h-full permite que o pai (ProfileCard) controle o tamanho da imagem proporcionalmente
  <View className="w-full h-full items-center justify-center p-2">
    <Image source={source} className="w-full h-full" resizeMode="contain" />
  </View>
);
