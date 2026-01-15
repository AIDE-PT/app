import { useFonts } from "expo-font";
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


  const Definicoes = () => {
  
        const [fontsLoaded] = useFonts({
          "Safiro-Medium": require("../assets/fonts/safiro/safiro-medium-webfont.ttf"),
          "OpenSans-Regular": require("../assets/fonts/open-sans/OpenSans-Regular.ttf"),
          "OpenSans-SemiBold": require("../assets/fonts/open-sans/OpenSans-SemiBold.ttf"),
        });
      
        if (!fontsLoaded) {
          return null;
        }

      }

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
            } else if (item === "Termos e Condições") {
              router.push("/terms-of-service");
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
