import React from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface SosButtonProps extends TouchableOpacityProps {
  className?: string;
}

const SosButton = ({ className, ...props }: SosButtonProps) => {
  return (
    <TouchableOpacity
      className={`bg-[#FF4B4B] rounded-[20px] py-3 px-12 items-center justify-center w-full ${className}`}
      activeOpacity={0.8}
      {...props}
    >
      <Text className="text-[#FFECEC] font-bold text-3xl tracking-widest">SOS</Text>
    </TouchableOpacity>
  );
};

export default SosButton;
