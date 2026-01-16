import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import ArrowIcon from "../svg/ArrowIcon";

interface BackButtonProps {
  label?: string;
  dark?: boolean;
  className?: string;
  onPress?: () => void;
}

const BackButton = ({
  label = "Voltar",
  className,
  dark,
  onPress,
}: BackButtonProps) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={onPress || (() => router.back())}
      activeOpacity={0.7}
      className={`flex-row items-center self-start py-2  ${className}`}
    >
      <ArrowIcon variant="LEFT" dark={dark} />
      {label && (
        <Text
          className={`${dark ? "text-black/60" : "text-black"} ml-2 text-2xl font-medium`}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default BackButton;
