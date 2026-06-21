import { Feather } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

type InAppPopupTone = "success" | "error" | "info";

interface InAppPopupProps {
  visible: boolean;
  title: string;
  message: string;
  buttonLabel?: string;
  tone?: InAppPopupTone;
  isDark?: boolean;
  onClose: () => void;
}

const toneConfig: Record<
  InAppPopupTone,
  { icon: keyof typeof Feather.glyphMap; light: string; dark: string }
> = {
  success: { icon: "check-circle", light: "#15803D", dark: "#86EFAC" },
  error: { icon: "alert-circle", light: "#B91C1C", dark: "#FCA5A5" },
  info: { icon: "info", light: "#3342CC", dark: "#C9D0FF" },
};

export default function InAppPopup({
  visible,
  title,
  message,
  buttonLabel = "OK",
  tone = "success",
  isDark = false,
  onClose,
}: InAppPopupProps) {
  const color = isDark ? toneConfig[tone].dark : toneConfig[tone].light;
  const buttonColor = toneConfig[tone].light;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/45 px-6">
        <View
          className={`w-full max-w-sm rounded-[28px] p-6 ${
            isDark ? "bg-aide-dark-card" : "bg-white"
          }`}
          style={{ boxShadow: "0 14px 32px 0 rgba(0, 0, 0, 0.22)" }}
        >
          <View
            className="mb-4 h-14 w-14 items-center justify-center rounded-full"
            style={{
              backgroundColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(80, 97, 255, 0.08)",
            }}
          >
            <Feather name={toneConfig[tone].icon} size={30} color={color} />
          </View>

          <Text
            className={`text-2xl font-safiro ${
              isDark ? "text-white" : "text-[#111827]"
            }`}
          >
            {title}
          </Text>
          <Text
            className={`mt-2 text-base leading-6 font-open-sans ${
              isDark ? "text-white/70" : "text-slate-700"
            }`}
          >
            {message}
          </Text>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={buttonLabel}
            className="mt-6 items-center rounded-[18px] px-5 py-4"
            style={{ backgroundColor: buttonColor }}
          >
            <Text className="text-base font-open-sans-semibold text-white">
              {buttonLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
