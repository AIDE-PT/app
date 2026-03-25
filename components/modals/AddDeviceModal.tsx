import { BlurView } from "expo-blur";
import React from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";

export interface Device {
  id: string;
  name: string;
}

interface AddDeviceModalProps {
  visible: boolean;
  onClose: () => void;
  availableDevices: Device[];
  onSelectDevice: (device: Device) => void;
}

export default function AddDeviceModal({
  visible,
  onClose,
  availableDevices,
  onSelectDevice,
}: AddDeviceModalProps) {
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
        <View className="flex-1 justify-end">
          <Pressable className="flex-1" onPress={onClose} />

          {/* Bottom Sheet Content */}
          <View
            className={`rounded-t-[31px] w-full items-center pb-12 ${isDark ? "bg-aide-dark-card" : "bg-[#DBEDF8]"}`}
            style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
          >
            {/* Drag handle */}
            <View className={`w-[33px] h-[4px] rounded-full mt-4 mb-4 ${isDark ? "bg-white/30" : "bg-[#79747E]"}`} />

            {/* Header Texts */}
            <View className="w-full px-6 mb-6">
              <Text className={`font-safiro text-2xl mb-4 capitalize ${isDark ? "text-white" : "text-black"}`}>
                Adicionar Dispositivos
              </Text>
              <Text className={`font-open-sans text-lg ${isDark ? "text-white/60" : "text-[#00072099]"}`}>
                Selecione uma das fontes de dados disponíveis
              </Text>
            </View>

            {/* Devices Grid */}
            <View className="w-full flex-row flex-wrap justify-center gap-4 px-4">
              {availableDevices.map((device) => (
                <TouchableOpacity
                  key={device.id}
                  onPress={() => {
                    onSelectDevice(device);
                    onClose();
                  }}
                  className={`w-[176px] h-[120px] rounded-[20px] flex-row items-center justify-center gap-2 px-4 ${isDark ? "bg-aide-dark-card border border-white/10" : "bg-white"}`}
                  style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
                >
                  <View className={`w-12 h-12 rounded-full items-center justify-center ${isDark ? "bg-white/20" : "bg-[#E9E9E9]"}`}>
                    <Text className={`font-open-sans font-bold text-xl ${isDark ? "text-white" : "text-black"}`}>
                      {device.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    {device.name.split(" ").length > 1 ? (
                      device.name.split(" ").map((word, index) => (
                        <Text
                          key={index}
                          className={`font-open-sans font-bold text-[18px] leading-5 ${isDark ? "text-white" : "text-black"}`}
                        >
                          {word}
                        </Text>
                      ))
                    ) : (
                      <Text className={`font-open-sans font-bold text-[20px] ${isDark ? "text-white" : "text-black"}`}>
                        {device.name}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
