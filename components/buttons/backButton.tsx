import { useTheme } from "@/hooks/useTheme";
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
  dark: darkProp,
  onPress,
}: BackButtonProps) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const useDarkMode = darkProp ?? isDark;

  return (
    <TouchableOpacity
      onPress={onPress || (() => router.back())}
      activeOpacity={0.7}
      className={`flex-row items-center self-start pt-3 pb-2 ${className}`}
      accessibilityRole="button"
      accessibilityLabel={label || "Voltar"}
      accessibilityHint="Volta para o ecrã anterior."
      accessibilityLanguage="pt-PT"
    >
      <ArrowIcon variant="LEFT" dark={useDarkMode} />
      {label && (
        <Text
          className={`${useDarkMode ? "text-white" : "text-black"} ml-2 text-2xl font-safiro`}
          accessibilityLanguage="pt-PT"
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default BackButton;
