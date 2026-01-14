import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import ElementoDefinicao from './elemento_definicao';

const DefinicoesLista = () => {
  const router = useRouter();

  const menuDefinicoes = [
    "Gerir Aiders", "Gerir Dispositivos (sensores)", "Segurança e Privacidade",
    "Temas e Cores", "Gerir dados", "Gerir perfil",
    "Termos e Condições", "Politica de Privacidade", "Sobre"
  ];

  return (
    <View className="w-full mt-2">
      {menuDefinicoes.map((item, index) => (
        <ElementoDefinicao 
          key={index}
          title={item} 
          onPress={() => item === "Gerir perfil" ? router.push('/gerir_perfil') : console.log(item)} 
        />
      ))}
    </View>
  );
};

export default DefinicoesLista;