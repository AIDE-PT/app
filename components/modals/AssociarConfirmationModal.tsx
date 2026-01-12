import React from "react";
import { Modal, Text, View, TouchableOpacity, Pressable } from "react-native";
import { BlurView } from "expo-blur";

interface AssociarConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data?: {
    name: string;
    email: string;
    initial?: string;
  };
}

export default function AssociarConfirmationModal({
  visible,
  onClose,
  onConfirm,
  data = {
    name: "Emilia Silva",
    email: "emiliasilva@gmail.com",
    initial: "E",
  },
}: AssociarConfirmationModalProps) {
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

      {/* Sheet modal: uses slide animation; content unchanged */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View className="flex-1 justify-end">
          {/* Bottom Sheet Content */}
          <View className="bg-[#DBEDF8] rounded-t-[31px] w-full items-center pb-12">
            {/* Draggable Handle */}
            <View className="w-[33px] h-[4px] bg-[#79747E] rounded-full mt-4 mb-8" />

            {/* User Profile Section */}
            <View className="flex-row items-center self-start px-8 mb-6">
              {/* Avatar */}
              <View className="w-16 h-16 rounded-full bg-[#E9E9E9] items-center justify-center border border-white mr-4">
                <Text className="font-semibold text-[28px] text-black">
                  {data.initial || data.name.charAt(0)}
                </Text>
              </View>

              {/* Info */}
              <View>
                <Text className="font-open-sans font-bold text-2xl text-black">
                  {data.name}
                </Text>
                <Text className="font-open-sans text-base text-black">
                  {data.email}
                </Text>
              </View>
            </View>

            {/* Prompt Question */}
            <Text className="font-open-sans text-base text-black px-8 mb-12 self-start">
              Pretende associar este cuidado à sua conta Aider?
            </Text>

            {/* Buttons Row */}
            <View className="flex-row justify-between w-full px-8 gap-4">
              {/* Cancel Button */}
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 bg-red-500/43 py-3 rounded-[25px] items-center justify-center"
                style={{ backgroundColor: 'rgba(255, 0, 0, 0.43)' }}
              >
                <Text className="font-open-sans font-semibold text-base text-black">
                  Não, voltar
                </Text>
              </TouchableOpacity>

              {/* Confirm Button */}
              <TouchableOpacity
                onPress={onConfirm}
                className="flex-1 bg-[#7C89FF] py-3 rounded-[25px] items-center justify-center"
              >
                <Text className="font-open-sans font-semibold text-base text-black">
                  Sim, associar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
