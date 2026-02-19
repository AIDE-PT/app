import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "../components/buttons/backButton";
import { Button } from "../components/buttons/button";
import { Input } from "../components/input/Input";
import LightBackground from "@/components/DotBackground";

export default function RecoverPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  return (
    <LightBackground>
      <View className="flex-1 px-4 pt-10 bg-aide-background">
        <SafeAreaView className="flex-1">
        <View className="mb-8">
          <BackButton label="Recuperar Password" dark />
        </View>

        <View className="mt-6 mb-8">
          <Text className="font-safiro text-[32px] text-[#1A1A2E] mb-2">
            Recuperar acesso
          </Text>
          <Text className="font-open-sans text-[15px] text-[#4B5563] leading-6">
            Introduza o seu email para receber instrucoes de redefinicao de
            password.
          </Text>
        </View>

        <Input
          variant="light"
          type="email"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />

        <View className="flex-1" />

        <View className="items-center mb-10">
          <Button
            variant="primary"
            label="Enviar"
            onPress={() => router.push("/login")}
          />
        </View>
      </SafeAreaView>
    </View>
  </LightBackground>
  );
}
