import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ArrowIcon from '../svg/ArrowIcon';

interface Cuidado {
    id: string;
    name: string;
}

interface ChoseCuidadoProps {
    cuidados: Cuidado[];
    selectedCuidado?: Cuidado;
    onSelect: (cuidado: Cuidado) => void;
    className?: string;
}

export const ChoseCuidado = ({ cuidados, selectedCuidado, onSelect, className }: ChoseCuidadoProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <View className="z-50">
            <TouchableOpacity
                onPress={() => setIsOpen(!isOpen)}
                className={`flex-row bg-white rounded-full py-4 px-8 items-center justify-center shadow-lg z-50 ${className}`}
                activeOpacity={0.8}
            >
                <Text className="text-xl font-semibold text-[#111111] mr-2">
                    {selectedCuidado?.name ?? 'Selecionar'}
                </Text>
                <ArrowIcon variant={isOpen ? "UP" : "DOWN"} dark size={20} />
            </TouchableOpacity>

            {isOpen && (
                <View className="absolute top-full left-0 right-0 -mt-10 bg-white rounded-[20px] shadow-lg z-40 px-6 py-8 pt-14">
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {cuidados.map((cuidado, index) => (
                            <View key={cuidado.id}>
                                <TouchableOpacity
                                    onPress={() => {
                                        onSelect(cuidado);
                                        setIsOpen(false);
                                    }}
                                    activeOpacity={0.7}
                                    className="py-3 items-center"
                                >
                                    <Text className="text-lg font-medium text-[#111111]">
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
            )}

            {isOpen && (
                <Modal transparent visible={isOpen} animationType="none">
                    <Pressable className="flex-1" onPress={() => setIsOpen(false)} />
                </Modal>
            )}
        </View>
    );
};

export default ChoseCuidado;
