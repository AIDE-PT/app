import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import ElementoDefinicao from "./elemento_definicao";

const DefinicoesLista = () => {
  const router = useRouter();

  const menuDefinicoes = [
    "Gerir Aiders",
    "Gerir Dispositivos (sensores)",
    "Segurança e Privacidade",
    "Temas e Cores",
    "Gerir dados",
    "Gerir perfil",
    "Termos e Condições",
    "Politica de Privacidade",
    "Sobre",
  ];

  return (
    <View className="w-full mt-2">
      {menuDefinicoes.map((item, index) => (
        <ElementoDefinicao
          key={index}
          title={item}
          onPress={() => {
            if (item === "Gerir perfil") {
              router.push("/gerir_perfil");
            } else if (item === "Gerir Dispositivos (sensores)") {
              router.push("/dispositivos");
            } else {
              console.log(item);
            }
          }}
        />
      ))}
    </View>
  );
};

export default DefinicoesLista;
