import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProfileImage } from './profileimage';

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
  onPress 
}: ProfileCardProps) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: isSelected ? 1.03 : 1,
      useNativeDriver: true,
      friction: 7,
    }).start();
  }, [isSelected]);

  const isFaded = isOtherSelected && !isSelected;

  return (
    <AnimatedCard 
      onPress={onPress}
      activeOpacity={0.9}
      style={{ 
        transform: [{ scale }],
        opacity: isFaded ? 0.35 : 1 
      }}
      className={`w-[48%] rounded-[40px] overflow-hidden border-2 ${
        isSelected ? 'border-blue-600 shadow-xl' : 'border-transparent'
      }`}
    >
      {isSelected ? (
        <LinearGradient 
          colors={['#E1EFFF', '#9DBFFF']} 
          className="p-6 h-[450px] justify-between rounded-[40px]"
        >
          <CardInner 
            title={title} 
            description={description} 
            imageSource={imageSource} 
            iconSource={iconSource} 
            isSelected={isSelected} 
          />
        </LinearGradient>
      ) : (
        <View className="bg-white p-6 h-[450px] justify-between shadow-sm rounded-[40px]">
          <CardInner 
            title={title} 
            description={description} 
            imageSource={imageSource} 
            iconSource={iconSource} 
            isSelected={isSelected} 
          />
        </View>
      )}
    </AnimatedCard>
  );
};

const CardInner = ({ title, description, imageSource, iconSource, isSelected }: any) => (
  <>
    <ProfileImage source={imageSource} />
    <View>
      <View className="flex-row items-center mb-1">
        <Image source={iconSource} className="w-5 h-5" resizeMode="contain" />
        <Text className="font-bold text-xl ml-2 text-gray-900">{title}</Text>
      </View>
      {isSelected && (
        <Text className="text-gray-700 text-[13px] font-medium leading-4 mt-1">
          {description}
        </Text>
      )}
    </View>
  </>
);