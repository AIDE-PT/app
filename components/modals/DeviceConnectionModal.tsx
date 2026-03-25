import { BlurView } from "expo-blur";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Device } from "./AddDeviceModal";
import { useTheme } from "@/hooks/useTheme";

interface DeviceConnectionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  device: Device | null;
}

export default function DeviceConnectionModal({
  visible,
  onClose,
  onConfirm,
  device,
}: DeviceConnectionModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { isDark, colors } = useTheme();

  const handleConnect = () => {
    setIsConnecting(true);
    // Mock Bluetooth connection delay
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      // Auto-confirm after showing success
      setTimeout(() => {
        onConfirm();
        // Reset state for next use
        setIsConnected(false);
      }, 1500);
    }, 2000);
  };

  const handleClose = () => {
    setIsConnecting(false);
    setIsConnected(false);
    onClose();
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
        onRequestClose={handleClose}
      >
        <BlurView intensity={50} tint="dark" className="flex-1">
          <Pressable className="flex-1 bg-black/30" onPress={handleClose} />
        </BlurView>
      </Modal>

      {/* Sheet modal: uses slide animation */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View className="flex-1 justify-end">
          <Pressable className="flex-1" onPress={handleClose} />

          {/* Bottom Sheet Content */}
          <View
            className={`rounded-t-[31px] w-full items-center pb-12 ${isDark ? "bg-aide-dark-card" : "bg-[#DBEDF8]"}`}
            style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
          >
            {/* Drag handle */}
            <View className={`w-[33px] h-[4px] rounded-full mt-4 mb-8 ${isDark ? "bg-white/30" : "bg-[#79747E]"}`} />

            {/* Device Info */}
            <View className="flex-row items-center self-start px-8 mb-6">
              <View className={`w-16 h-16 rounded-full items-center justify-center border border-white mr-4 ${isDark ? "bg-white/20" : "bg-[#E9E9E9]"}`}>
                <Text className={`font-open-sans font-bold text-[28px] ${isDark ? "text-white" : "text-black"}`}>
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
                  <Text className={`font-open-sans font-bold text-2xl ${isDark ? "text-white" : "text-black"}`}>
                    {device.name}
                  </Text>
                )}
              </View>
            </View>

            {/* Status Message */}
            <View className="px-8 mb-8 self-start">
              {isConnecting ? (
                <View className="flex-row items-center gap-3">
                  <ActivityIndicator
                    size="small"
                    color="#7C89FF"
                    accessibilityLabel={`A conectar ${device.name}`}
                  />
                  <Text className={`font-open-sans text-base ${isDark ? "text-white" : "text-black"}`}>
                    A conectar via Bluetooth...
                  </Text>
                </View>
              ) : isConnected ? (
                <Text className="font-open-sans text-base" style={{ color: colors.semantic.success }}>
                  ✓ Dispositivo conectado com sucesso!
                </Text>
              ) : (
                <Text className={`font-open-sans text-base ${isDark ? "text-white" : "text-black"}`}>
                  Pretende conectar este dispositivo via Bluetooth?
                </Text>
              )}
            </View>

            {/* Buttons Row */}
            {!isConnecting && !isConnected && (
              <View className="flex-row justify-between w-full px-8 gap-4">
                <TouchableOpacity
                  onPress={handleClose}
                  className="flex-1 py-3 rounded-[25px] items-center justify-center"
                  style={{ backgroundColor: "rgba(255, 0, 0, 0.43)" }}
                >
                  <Text className={`font-open-sans font-semibold text-base ${isDark ? "text-white" : "text-black"}`}>
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConnect}
                  className="flex-1 bg-[#7C89FF] py-3 rounded-[25px] items-center justify-center"
                >
                  <Text className="font-open-sans font-semibold text-base text-black">
                    Conectar
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
