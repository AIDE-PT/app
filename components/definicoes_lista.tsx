import { useAuth } from "@/contexts/AuthContext";
import { useConsentPrivacy } from "@/contexts/ConsentPrivacyContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { Alert, View } from "react-native";
import ElementoDefinicao from "./elemento_definicao";

const ONBOARDING_STORAGE_KEY = "@aide_onboarding";

const DefinicoesLista = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { isConsentPopupVisible, toggleConsentPopup } = useConsentPrivacy();

  const handleResetOnboardingDebug = useCallback(async () => {
    if (!user?.id) {
      Alert.alert("Debug onboarding", "Sem utilizador autenticado.");
      return;
    }

    try {
      await AsyncStorage.removeItem(`${ONBOARDING_STORAGE_KEY}:${user.id}`);
      Alert.alert(
        "Debug onboarding",
        "Onboarding reativado para este utilizador.",
      );
    } catch (error) {
      console.log("Erro ao resetar onboarding (debug)", error);
      Alert.alert(
        "Debug onboarding",
        "Não foi possível reativar o onboarding.",
      );
    }
  }, [user?.id]);

  const menuDefinicoes: { label: string; href?: string }[] = [
    { label: "Gerir Aiders", href: "/associar" },
    { label: "Gerir Dispositivos (sensores)", href: "/dispositivos" },
    { label: "Temas e Cores", href: "/personalizacao" },
    { label: "Gerir dados", href: "/healthData" },
    { label: "Gerir perfil", href: "/gerir_perfil" },
    { label: "Termos e Condições", href: "/terms-of-service" },
    { label: "Politica de Privacidade", href: "/privacidade" },
    { label: "Sobre", href: "/sobre" },
  ];

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

      {__DEV__ ? (
        <ElementoDefinicao
          title="Debug: Reativar onboarding"
          onPress={() => {
            void handleResetOnboardingDebug();
          }}
        />
      ) : null}
    </View>
  );
};

export default DefinicoesLista;
