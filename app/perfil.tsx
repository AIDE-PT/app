import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import aider from "../assets/images/aider.png";
import cuidado from "../assets/images/cuidado.png";
import icon_aider from "../assets/images/icon_aider.png";
import icon_cuidado from "../assets/images/icon_cuidado.png";
import { Profilecard } from "../components/profilecard";

export default function PerfilScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<"aider" | "cuidado" | null>(null);

  const [fontsLoaded] = useFonts({
    "Safiro-Medium": require("../assets/fonts/safiro/safiro-medium-webfont.ttf"),
    "OpenSans-Regular": require("../assets/fonts/open-sans/OpenSans-Regular.ttf"),
    "OpenSans-SemiBold": require("../assets/fonts/open-sans/OpenSans-SemiBold.ttf"),
  });

  const handleAvançar = () => {
    if (selected === "cuidado") {
      router.push("/extraData");
    } else {
      router.push("./associar");
    }
  };

  return (
    <View className="flex-1 px-4 pt-10 bg-aide-background">
      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="">
            {/* Título e Subtítulo */}
            <View className="mt-12 mb-8">
              <Text className="text-4xl font-safiro text-black">Registo</Text>
              <Text className="text-lg font-open-sans text-gray-600 mt-2">
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
              />
              <Profilecard
                title="Cuidado"
                description="Vou partilhar os meus dados de saúde."
                imageSource={cuidado}
                iconSource={icon_cuidado}
                isSelected={selected === "cuidado"}
                isOtherSelected={selected === "aider"}
                onPress={() => setSelected("cuidado")}
              />
            </View>

            {/* Espaçador flexível */}
            <View style={{ flex: 1 }} />

            {/* Botão Avançar */}
            <View className="items-center mt-10">
              <TouchableOpacity
                disabled={!selected}
                onPress={handleAvançar}
                activeOpacity={0.8}
                className={`w-full py-5 rounded-[22px] items-center ${
                  selected ? "bg-[#7C94FF]" : "bg-white shadow-sm"
                }`}
              >
                <Text
                  className={`text-xl font-bold ${selected ? "text-white" : "text-gray-400"}`}
                >
                  Avançar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
