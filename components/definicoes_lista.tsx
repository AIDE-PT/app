import { useConsentPrivacy } from "@/contexts/ConsentPrivacyContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import ElementoDefinicao from "./elemento_definicao";

const DefinicoesLista = () => {
  const router = useRouter();
  const { profileType } = useUserProfile();
  const { isConsentPopupVisible, toggleConsentPopup } = useConsentPrivacy();

  const menuDefinicoesBase: { label: string; href?: string }[] = [
    { label: "Gerir Aiders", href: "/associar" },
    { label: "Gerir Dispositivos (sensores)", href: "/dispositivos" },
    { label: "Temas e Cores", href: "/personalizacao" },
    { label: "Gerir perfil", href: "/gerir_perfil" },
    { label: "Termos e Condições", href: "/terms-of-service" },
    { label: "Politica de Privacidade", href: "/privacidade" },
    { label: "Sobre", href: "/sobre" },
  ];

  const menuDefinicoes =
    profileType === "cuidado"
      ? menuDefinicoesBase
      : menuDefinicoesBase.filter((item) => item.href !== "/dispositivos");

  return (
    <View className="w-full mt-2">
      {menuDefinicoes.map((item, index) => (
        <ElementoDefinicao
          key={index}
          title={item.label}
          onPress={() => {
            if (item.href) {
              router.push(item.href as any);
              return;
            }
            console.log(item.label);
          }}
        />
      ))}

      <ElementoDefinicao
        title={
          isConsentPopupVisible
            ? "Ocultar Gestão de Consentimento e Privacidade"
            : "Mostrar Gestão de Consentimento e Privacidade"
        }
        onPress={toggleConsentPopup}
      />
    </View>
  );
};

export default DefinicoesLista;
