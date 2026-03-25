import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/buttons/button";
import { GradientBackground } from "../components/GradientBackground";
import { Input } from "../components/input/Input";
import "../global.css";

export default function CompleteProfile() {
  const router = useRouter();
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState("");

  const handleNext = () => {
    console.log("Profile data:", { age, weight, height, gender });
    router.push("/");
  };

  return (
    <GradientBackground forceLight>
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 pt-10">
          <Text className="mb-10 font-safiro text-[32px] text-[#1A1A2E]">
            So mais uma coisa...
          </Text>

          <View className="mb-4 gap-4">
            <Input
              variant="light"
              forceLight
              type="text"
              label="Idade"
              placeholder="Idade"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              helperText="Indique a idade em anos."
            />

            <Input
              variant="light"
              forceLight
              type="text"
              label="Peso"
              placeholder="Peso"
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              helperText="Introduza o peso atual."
            />

            <Input
              variant="light"
              forceLight
              type="text"
              label="Altura"
              placeholder="Altura"
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              helperText="Introduza a altura em metros ou centimetros."
            />

            <Input
              variant="light"
              forceLight
              type="text"
              label="Genero"
              placeholder="Genero"
              value={gender}
              onChangeText={setGender}
              helperText="Indique o genero com que a pessoa se identifica."
            />
          </View>

          <View className="flex-1" />

          <View className="items-center pb-8">
            <Button
              variant="primary"
              forceLight
              label="Avancar"
              onPress={handleNext}
            />
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}
