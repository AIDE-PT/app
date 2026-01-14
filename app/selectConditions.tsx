import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/buttons/button";
import { ChipButton } from "../components/buttons/ChipButton";
import { SearchBar } from "../components/input/SearchBar";
import { LightBackground } from "../components/LightBackground";

import "../global.css";

const ALL_CONDITIONS = [
  "Hipoglicemia",
  "Hepatopatia",
  "Asma",
  "Hipertensão",
  "TOC",
  "Hipotensão",
  "Diabetes",
  "Hiperglicemia",
];

export default function SelectConditions() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);

  const toggleCondition = (condition: string) => {
    setSelectedConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition],
    );
  };

  const filteredConditions = ALL_CONDITIONS.filter((condition) =>
    condition.toLowerCase().includes(searchText.toLowerCase()),
  );

  const handleAdvance = () => {
    router.push({
      pathname: "/recommendations" as any,
      params: { conditions: selectedConditions.join(",") },
    });
  };

  return (
    <LightBackground>
      <SafeAreaView className="flex-1 px-6">
        <View className="mt-12 mb-2">
          <Text className="text-3xl font-bold text-black/90">Para começar</Text>
          <Text className="text-base text-black/60 mt-1">
            Selecione as suas doenças
          </Text>
        </View>

        <View className="mt-6 mb-4">
          <SearchBar
            placeholder="Doenças que tenha"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View className="flex-row flex-wrap gap-2">
          {filteredConditions.map((condition) => (
            <ChipButton
              key={condition}
              label={condition}
              selected={selectedConditions.includes(condition)}
              onPress={() => toggleCondition(condition)}
            />
          ))}
        </View>

        <View className="flex-1" />

        <View className="items-center mb-8">
          <Button variant="primary" label="Avançar" onPress={handleAdvance} />
        </View>
      </SafeAreaView>
    </LightBackground>
  );
}
