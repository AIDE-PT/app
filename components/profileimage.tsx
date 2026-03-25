import React from "react";
import { Image, ImageSourcePropType, View } from "react-native";

interface ProfileImageProps {
  source: ImageSourcePropType;
  accessibilityLabel?: string;
  accessible?: boolean;
}

export const ProfileImage = ({
  source,
  accessibilityLabel,
  accessible = true,
}: ProfileImageProps) => (
  <View className="w-full h-full items-center justify-start p-2 pt-4">
    <Image
      source={source}
      className="w-full h-[90%]"
      resizeMode="contain"
      accessible={accessible}
      accessibilityRole={accessible ? "image" : undefined}
      accessibilityLabel={accessible ? accessibilityLabel : undefined}
    />
  </View>
);
