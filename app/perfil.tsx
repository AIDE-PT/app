import React, { useEffect, useRef, useState } from 'react';
import { Animated, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router'; // Assumindo que usas expo-router

// Importação das imagens
import aider from '../assets/images/aider.png';
import cuidado from '../assets/images/cuidado.png';
import icon_aider from '../assets/images/icon_aider.png';
import icon_cuidado from '../assets/images/icon_cuidado.png';
import { Profilecard } from '../components/profilecard';

const AnimatedButton = Animated.createAnimatedComponent(TouchableOpacity);

export default function PerfilScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<'aider' | 'cuidado' | null>(null);
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Animação de feedback ao selecionar
  useEffect(() => {
    if (selected) {
      Animated.sequence([
        Animated.spring(buttonScale, { toValue: 1.05, useNativeDriver: true, friction: 3 }),
        Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, friction: 3 })
      ]).start();
    }
  }, [selected]);

  // Lógica de navegação baseada na seleção
  const handleAvançar = () => {
    if (selected === 'aider') {
      router.push('/home_aider');
    } else if (selected === 'cuidado') {
      router.push('/home_cuidado');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F1F7FF]">
      <View className="flex-1 px-8">
        
        {/* Títulos da Página */}
        <View className="mt-16">
          <Text className="text-4xl font-bold text-black">Registo</Text>
          <Text className="mt-2 text-lg text-gray-600">Como pretende utilizar a aplicação?</Text>
        </View>

        {/* Cards de Seleção */}
        <View className="flex-row justify-between mt-10">
          <Profilecard 
            title="Aider"
            description="Vou monitorizar e acompanhar"
            imageSource={aider}
            iconSource={icon_aider}
            isSelected={selected === 'aider'}
            isOtherSelected={selected === 'cuidado'}
            onPress={() => setSelected('aider')}
          />

          <Profilecard 
            title="Cuidado"
            description="Vou partilhar os meus dados de saúde."
            imageSource={cuidado}
            iconSource={icon_cuidado}
            isSelected={selected === 'cuidado'}
            isOtherSelected={selected === 'aider'}
            onPress={() => setSelected('cuidado')}
          />
        </View>

        {/* Espaçador que empurra o botão para o fundo */}
        <View className="flex-1" />

        {/* Botão de ação final corrigido */}
 {/* Container do Botão */}
        <View className="items-center mb-12 w-full px-6">
          <AnimatedButton 
            disabled={!selected}
            onPress={handleAvançar}
            style={{ transform: [{ scale: buttonScale }] }}
            className={`w-full max-w-[300px] py-4 rounded-full items-center justify-center ${
              selected 
                ? 'bg-[#7C94FF] shadow-xl shadow-[#7C94FF]/50' 
                : 'bg-white shadow-md shadow-black/10'
            }`}
          >
            <Text className={`text-xl font-bold ${
              selected ? 'text-white' : 'text-black'
            }`}>
              Avançar
            </Text>
          </AnimatedButton>
        </View>

      </View> 
    </SafeAreaView>
  );
}