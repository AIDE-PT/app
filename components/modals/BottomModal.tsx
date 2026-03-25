import { BlurView } from "expo-blur";
import React from "react";
import { Modal, View, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";

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
          className={`overflow-y-auto h-[60%] pt-3 px-4 pb-6 rounded-t-[30px] ${isDark ? "bg-aide-dark-card" : "bg-[#DBEDF8]"}`}
        >
          {/* Handle */}
          <View
            className={`w-10 h-1 rounded-2 self-center mb-4 ${isDark ? "bg-white/30" : "bg-[#C7C7C7]"}`}
          />
          <SafeAreaView className="flex-1">
            <ScrollView>{children}</ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}
