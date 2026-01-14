import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import ElementoDefinicao from './elemento_definicao';

// Lógica de dados separada (Poderia estar num ficheiro config.ts)
const MENU_CONFIG = [
  { label: 'Gerir Aiders', route: null },
  { label: 'Gerir Dispositivos (sensores)', route: null },
  { label: 'Segurança e Privacidade', route: null },
  { label: 'Temas e Cores', route: null },
  { label: 'Gerir dados', route: null },
  { label: 'Gerir perfil', route: '/gerir_perfil' },
  { label: 'Termos e Condições', route: null },
  { label: 'Politica de Privacidade', route: null },
  { label: 'Sobre', route: null },
] as const;

const DefinicoesLista = () => {
  const router = useRouter();

  return (
    <View className="w-full mt-2">
      {MENU_CONFIG.map((item, index) => (
        <ElementoDefinicao 
          key={`${item.label}-${index}`}
          title={item.label} 
          onPress={() => item.route ? router.push(item.route) : console.log(item.label)} 
        />
      ))}
    </View>
  );
};

export default DefinicoesLista;