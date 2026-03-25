import { useRouter } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import aider from "../assets/images/aider.png";
import cuidado from "../assets/images/cuidado.png";
import icon_aider from "../assets/images/icon_aider.png";
import icon_cuidado from "../assets/images/icon_cuidado.png";
import { Profilecard } from "../components/profilecard";
import { Button } from "../components/buttons/button";
import LightBackground from "@/components/DotBackground";
import { useUserProfile } from "@/contexts/UserProfileContext";

export default function PerfilScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<"aider" | "cuidado" | null>(null);
  const isDark = false;
  const { setProfileType } = useUserProfile();

  const handleAvançar = () => {
    if (!selected) return;
    setProfileType(selected);
    if (selected === "cuidado") {
      router.push("/extraData");
    } else {
      router.push("/associar");
    }
  };

  return (
    <LightBackground forceLight>
      <View className="flex-1 px-4 pt-10">
        <SafeAreaView className="flex-1">
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="">
              {/* Título e Subtítulo */}
              <View className="mt-12 mb-8">
                <Text
                  className={`text-4xl font-safiro ${isDark ? "text-white" : "text-black"}`}
                >
                  Registo
                </Text>
                <Text
                  className={`text-lg font-open-sans mt-2 ${isDark ? "text-white/60" : "text-gray-600"}`}
                >
                  Como pretende utilizar a aplicação?
                </Text>
              </View>

              {/* ÁREA DOS CARDS - Aumentada a margem para evitar sobreposição no topo */}
              <View className="flex-row" style={{ gap: 15 }}>
                <Profilecard
                  title="Aider"
                  description="Vou monitorizar e acompanhar"
                  imageSource={aider}
                  iconSource={icon_aider}
                  isSelected={selected === "aider"}
                  isOtherSelected={selected === "cuidado"}
                  onPress={() => setSelected("aider")}
                  forceLight
                />
                <Profilecard
                  title="Cuidado"
                  description="Vou partilhar os meus dados de saúde."
                  imageSource={cuidado}
                  iconSource={icon_cuidado}
                  isSelected={selected === "cuidado"}
                  isOtherSelected={selected === "aider"}
                  onPress={() => setSelected("cuidado")}
                  forceLight
                />
              </View>

              {/* Espaçador flexível */}
              <View style={{ flex: 1 }} />

              {/* Botão Avançar */}
              <View className="items-center mt-10">
                <Button
                  variant="primary"
                  forceLight
                  label="Avançar"
                  onPress={handleAvançar}
                  disabled={!selected}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </LightBackground>
  );
}
