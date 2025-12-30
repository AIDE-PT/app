import React from 'react';
import { Image, ImageSourcePropType, View } from 'react-native';

interface ProfileImageProps {
  source: ImageSourcePropType;
}

export const ProfileImage = ({ source }: ProfileImageProps) => (
  <View className="items-center justify-center">
    <Image 
      source={source} 
      className="w-40 h-52" 
      resizeMode="contain" 
    />
  </View>
);