import LightBackground from "@/components/DotBackground";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "../components/buttons/backButton";
import { Button } from "../components/buttons/button";
import { Input } from "../components/input/Input";

export default function RecoverPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  return (
    <LightBackground forceLight>
      <View className="flex-1 bg-transparent px-4 pt-10">
        <SafeAreaView className="flex-1">
          <View className="mb-4">
            <BackButton label="Recuperar Password" dark={false} />
          </View>

          <View className="mb-8 mt-6">
            <Text className="mb-2 font-safiro text-[32px] text-[#1A1A2E]">
              Recuperar acesso
            </Text>
            <Text className="font-open-sans text-[15px] leading-6 text-[#4B5563]">
              Introduza o seu email para receber instrucoes de redefinicao de
              password.
            </Text>
          </View>

          <Input
            variant="light"
            forceLight
            type="email"
            label="Email"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            helperText="Recebera as instrucoes de recuperacao neste endereco."
          />

          <View className="flex-1" />

          <View className="mb-10 items-center">
            <Button
              variant="primary"
              forceLight
              label="Enviar"
              onPress={() => router.push("/login")}
            />
          </View>
        </SafeAreaView>
      </View>
    </LightBackground>
  );
}
