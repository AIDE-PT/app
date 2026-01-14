import React from 'react';
import { View, ScrollView, SafeAreaView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import BackButton from '../components/buttons/backButton'; 
import DefinicoesLista from '../components/definicoes_lista';

const Definicoes = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#F5F9FF]">
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-6 py-8">
          <BackButton 
            title="Definições" 
            onPress={() => router.push('/login')} 
          />
        </View>

        <DefinicoesLista />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Definicoes;