import React from "react";
import { Image, ImageSourcePropType, View } from "react-native";

interface ProfileImageProps {
  source: ImageSourcePropType;
}

export const ProfileImage = ({ source }: ProfileImageProps) => (
  // h-full permite que o pai (ProfileCard) controle o tamanho da imagem proporcionalmente
  // alignItems-center ensures vertical alignment is centered
  <View className="w-full h-full items-center justify-start p-2 pt-4">
    <Image source={source} className="w-full h-[90%]" resizeMode="contain" />
  </View>
);
