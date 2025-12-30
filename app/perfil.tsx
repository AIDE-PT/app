import React, { useEffect, useRef, useState } from 'react';
import { Animated, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
// Importamos o componente reaproveitável da pasta superior
import aider from '../assets/images/aider.png';
import cuidado from '../assets/images/cuidado.png';
import icon_aider from '../assets/images/icon_aider.png';
import icon_cuidado from '../assets/images/icon_cuidado.png';
import { Profilecard } from '../components/profilecard';

const AnimatedButton = Animated.createAnimatedComponent(TouchableOpacity);

export default function PerfilScreen() {
  // Estado que gere a seleção entre os dois cards
  const [selected, setSelected] = useState<'aider' | 'cuidado' | null>(null);
  
  // Referência para a animação do botão
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Animação de "pulo" ao selecionar uma opção
  useEffect(() => {
    if (selected) {
      Animated.sequence([
        Animated.spring(buttonScale, { toValue: 1.05, useNativeDriver: true, friction: 3 }),
        Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, friction: 3 })
      ]).start();
    }
  }, [selected]);

  return (
    <SafeAreaView className="flex-1 bg-[#F1F7FF] px-6">
      {/* Títulos da Página */}
      <View className="mt-16">
        <Text className="text-4xl font-bold text-gray-900">Registo</Text>
        <Text className="mt-2 text-lg text-gray-600">Como pretende utilizar a aplicação?</Text>
      </View>

      {/* Invocação dos componentes reaproveitáveis */}
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

      {/* Botão de ação final */}
      <AnimatedButton 
        disabled={!selected}
        style={{ transform: [{ scale: buttonScale }] }}
        className={`mt-auto mb-10 py-5 rounded-[28px] items-center ${
          selected 
            ? 'bg-[#7C94FF] shadow-lg shadow-blue-300' 
            : 'bg-white border border-gray-100'
        }`}
        onPress={() => console.log("Perfil escolhido:", selected)}
      >
        <Text className={`text-xl font-bold ${selected ? 'text-white' : 'text-gray-300'}`}>
          Avançar
        </Text>
      </AnimatedButton>
    </SafeAreaView>
  );
}