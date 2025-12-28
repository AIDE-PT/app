import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import ArrowIcon from '../svg/ArrowIcon';
import { useRouter } from 'expo-router';

interface BackButtonProps {
    label?: string;
    dark?: boolean;
    className?: string;
}

const BackButton = ({ label = "Voltar", className, dark }: BackButtonProps) => {

    const router = useRouter()
    return (
        <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className={`flex-row items-center self-start py-2  ${className}`}
        >
            <ArrowIcon variant='LEFT' dark={dark} />
            {label && (
                <Text className={`${dark ? 'text-black/60' : 'text-white'} ml-2 text-2xl font-medium`}>
                    {label}
                </Text>
            )}
        </TouchableOpacity>
    );
};

export default BackButton;