import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import DefinicoesLista from '../components/definicoes_lista';

const Definicoes = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#F5F9FF]">
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho Responsivo */}
        <View className="flex-row items-center px-6 py-8">
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={32} color="black" />
          </TouchableOpacity>
          <Text className="text-4xl font-bold ml-4 text-[#111]">Definições</Text>
        </View>

        {/* Lista de botões utilizando o componente reaproveitado */}
        <DefinicoesLista />

      </ScrollView>
    </SafeAreaView>
  );
};

export default Definicoes;