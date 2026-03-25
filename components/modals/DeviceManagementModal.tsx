import { BlurView } from "expo-blur";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Device } from "./AddDeviceModal";
import { useTheme } from "@/hooks/useTheme";

interface DeviceWithStatus extends Device {
  isDataSharingEnabled: boolean;
}

interface DeviceManagementModalProps {
  visible: boolean;
  onClose: () => void;
  onRemove: () => void;
  onToggleDataSharing: (enabled: boolean) => void;
  device: DeviceWithStatus | null;
}

export default function DeviceManagementModal({
  visible,
  onClose,
  onRemove,
  onToggleDataSharing,
  device,
}: DeviceManagementModalProps) {
  const [shareData, setShareData] = useState(
    device?.isDataSharingEnabled ?? true,
  );
  const { isDark } = useTheme();

  const handleToggle = (value: boolean) => {
    setShareData(value);
    onToggleDataSharing(value);
  };

  if (!device) return null;

  const nameWords = device.name.split(" ");

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
        <View className="flex-1 justify-end">
          <Pressable className="flex-1" onPress={onClose} />

          {/* Bottom Sheet Content */}
          <View
            className={`rounded-t-[31px] w-full items-center pb-12 ${isDark ? "bg-aide-dark-card" : "bg-[#DBEDF8]"}`}
            style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
          >
            {/* Drag handle */}
            <View
              className={`w-[33px] h-[4px] rounded-full mt-4 mb-8 ${isDark ? "bg-white/40" : "bg-[#6E6872]"}`}
            />

            {/* Device Info */}
            <View className="flex-row items-center self-start px-8 mb-6">
              <View
                className={`w-16 h-16 rounded-full items-center justify-center border mr-4 ${isDark ? "border-white/20 bg-white/20" : "border-[#B8CFDF] bg-[#E9E9E9]"}`}
              >
                <Text
                  className={`font-open-sans font-bold text-[28px] ${isDark ? "text-white" : "text-black"}`}
                >
                  {device.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                {nameWords.length > 1 ? (
                  nameWords.map((word, index) => (
                    <Text
                      key={index}
                      className={`font-open-sans font-bold text-2xl leading-7 ${isDark ? "text-white" : "text-black"}`}
                    >
                      {word}
                    </Text>
                  ))
                ) : (
                  <Text
                    className={`font-open-sans font-bold text-2xl ${isDark ? "text-white" : "text-black"}`}
                  >
                    {device.name}
                  </Text>
                )}
              </View>
            </View>

            {/* Data Sharing Toggle */}
            <View className="flex-row justify-between items-center w-full px-8 mb-8">
              <Text
                className={`font-open-sans text-base ${isDark ? "text-white" : "text-black"}`}
              >
                Partilhar dados
              </Text>
              <Switch
                value={shareData}
                onValueChange={handleToggle}
                trackColor={{ false: "#767577", true: "#7C89FF" }}
                thumbColor={shareData ? "#ffffff" : "#FFFFFF"}
                accessibilityLabel={`Partilhar dados de ${device.name}`}
                accessibilityHint="Ativa ou desativa a partilha de dados deste dispositivo."
              />
            </View>

            {/* Remove Button */}
            <TouchableOpacity onPress={onRemove} className="w-full px-8">
              <View className="bg-[#E45858] py-3 rounded-[25px] items-center justify-center">
                <Text className="font-open-sans font-semibold text-base text-white">
                  Remover dispositivo
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

export type { DeviceWithStatus };
