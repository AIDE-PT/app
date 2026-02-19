import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import ArrowIcon from "../svg/ArrowIcon";
import { useTheme } from "@/hooks/useTheme";

interface BackButtonProps {
  label?: string;
  dark?: boolean;
  className?: string;
  onPress?: () => void;
}

const BackButton = ({
  label = "Voltar",
  className,
  dark: darkProp,
  onPress,
}: BackButtonProps) => {
  const router = useRouter();
  const { isDark } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress || (() => router.back())}
      activeOpacity={0.7}
      className={`flex-row items-center self-start py-2  ${className}`}
    >
      <ArrowIcon variant="LEFT" dark={isDark} />
      {label && (
        <Text
          className={`${isDark ? "text-white" : "text-black"} ml-2 text-2xl font-safiro`}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default BackButton;
