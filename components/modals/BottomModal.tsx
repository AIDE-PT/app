import { useTheme } from "@/hooks/useTheme";
import { BlurView } from "expo-blur";
import React from "react";
import { Modal, Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface BottomModalProps {
  visible: boolean;
  onClose: any;
  children?: any;
}

export default function BottomModal({
  visible,
  onClose,
  children,
}: BottomModalProps) {
  const { isDark } = useTheme();
  const { height } = useWindowDimensions();

  const sheetHeight = Math.round(
    Math.min(Math.max(height * 0.62, 380), height * 0.82),
  );

  return (
    <>
      {/* Backdrop modal: fades/blur, no slide */}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
      >
        <BlurView intensity={50} tint="dark" className="flex-1">
          <Pressable className="flex-1 bg-black/30" onPress={onClose} />
        </BlurView>
      </Modal>

      {/* Sheet modal: uses slide animation */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <Pressable className="flex-1" onPress={onClose} />

        <View
          className={`pt-3 px-4 pb-4 rounded-t-[30px] ${isDark ? "bg-aide-dark-card" : "bg-[#DBEDF8]"}`}
          style={{ height: sheetHeight }}
        >
          {/* Handle */}
          <View
            className={`w-10 h-1 rounded-2 self-center mb-4 ${isDark ? "bg-white/30" : "bg-[#C7C7C7]"}`}
          />
          <SafeAreaView className="flex-1">
            <ScrollView
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}
