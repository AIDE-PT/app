import React from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Cuidado {
    id: string;
    name: string;
}

interface CuidadoModalProps {
    visible: boolean;
    onClose: () => void;
    cuidados: Cuidado[];
    onSelect: (cuidado: Cuidado) => void;
}

export default function CuidadoModal({ visible, onClose, cuidados, onSelect }: CuidadoModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <Pressable className="flex-1" onPress={onClose}>
                <View className="items-center">
                    <View className="bg-white mt-20 px-8 pb-4 pt-14 rounded-b-[30px] shadow-lg">
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {cuidados.map((cuidado, index) => (
                                <View key={cuidado.id}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            onSelect(cuidado);
                                            onClose();
                                        }}
                                        activeOpacity={0.7}
                                        className="py-3 items-center"
                                    >
                                        <Text className="text-xl font-semibold text-[#111111]">
                                            {cuidado.name}
                                        </Text>
                                    </TouchableOpacity>
                                    {index < cuidados.length - 1 && (
                                        <View className="h-[1px] bg-[#E5E5E5]" />
                                    )}
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Pressable>
        </Modal>
    );
}
