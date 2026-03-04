import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/buttons/button";
import { ChipButton } from "../components/buttons/ChipButton";
import { SearchBar } from "../components/input/SearchBar";

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

  const [fontsLoaded] = useFonts({
    "Safiro-Medium": require("../assets/fonts/safiro/safiro-medium-webfont.ttf"),
    "OpenSans-Regular": require("../assets/fonts/open-sans/OpenSans-Regular.ttf"),
    "OpenSans-SemiBold": require("../assets/fonts/open-sans/OpenSans-SemiBold.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleAdvance = () => {
    router.push({
      pathname: "/recommendations" as any,
      params: { conditions: selectedConditions.join(",") },
    });
  };

  return (
    <View className="flex-1 px-4 pt-10 bg-aide-background">
      <SafeAreaView className="flex-1">
        <View className="mt-12 mb-6">
          <Text className="font-safiro text-3xl text-black/90">
            Só mais uma coisa...
          </Text>
        </View>

        <View className="mb-6">
          <SearchBar
            placeholder="Doenças que tenha"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View className="flex-row flex-wrap gap-4">
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
    </View>
  );
}
