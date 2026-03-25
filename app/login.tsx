import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/buttons/button";
import { SocialButton } from "../components/buttons/socialButton";
import { Input } from "../components/input/Input";
import "../global.css";
import { LightBackground } from "@/components/DotBackground";

const DividerWithText = ({
  text,
  isDark,
}: {
  text: string;
  isDark: boolean;
}) => (
  <View className="my-6 flex-row items-center">
    <View
      className={`h-[1px] flex-1 ${isDark ? "bg-white/20" : "bg-[#D1D5DB]"}`}
    />
    <Text
      className={`mx-4 font-open-sans text-[16px] ${
        isDark ? "text-white/60" : "text-[#6B7280]"
      }`}
    >
      {text}
    </Text>
    <View
      className={`h-[1px] flex-1 ${isDark ? "bg-white/20" : "bg-[#D1D5DB]"}`}
    />
  </View>
);

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isDark = false;

  const handleLogin = () => {
    router.push("/testDashboard" as any);
  };

  const handleGoogleLogin = () => {
    console.log("Login with Google");
  };

  const handleAppleLogin = () => {
    console.log("Login with Apple");
  };

  return (
    <LightBackground forceLight>
      <View className="flex-1 px-4 pt-10">
        <SafeAreaView className="flex-1">
          <View className="flex-1">
            <View className="mb-8 mt-12">
              <Text
                className={`font-safiro text-[32px] ${
                  isDark ? "text-white" : "text-[#1A1A2E]"
                }`}
              >
                Login
              </Text>
            </View>

            <View className="mb-4 gap-4">
              <Input
                variant="light"
                forceLight
                type="email"
                label="Email ou telemovel"
                placeholder="Email/telemovel"
                value={email}
                onChangeText={setEmail}
                helperText="Introduza o email ou numero usado no registo."
                validateAs="emailOrPhone"
              />

              <Input
                variant="light"
                forceLight
                type="password"
                label="Password"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                helperText="Escreva a password da sua conta."
              />
            </View>

            <DividerWithText text="Ou" isDark={isDark} />

            <View className="mb-10 gap-3">
              <SocialButton
                provider="google"
                onPress={handleGoogleLogin}
                forceLight
              />
              <SocialButton
                provider="apple"
                onPress={handleAppleLogin}
                forceLight
              />
            </View>

            <View className="flex-1" />

            <View className="mb-10 items-center">
              <Button
                variant="primary"
                forceLight
                label="Avancar"
                onPress={handleLogin}
              />

              <View className="mt-6 flex-row">
                <Text
                  className={`font-open-sans-semibold text-[14px] ${
                    isDark ? "text-white/60" : "text-[#6B7280]"
                  }`}
                >
                  Nao tem uma conta?{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/register" as any)}
                >
                  <Text className="font-open-sans-semibold text-[14px] text-[#5C6CFF]">
                    Regista-te
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="mt-3 flex-row">
                <Text
                  className={`font-open-sans-semibold text-[14px] ${
                    isDark ? "text-white/60" : "text-[#6B7280]"
                  }`}
                >
                  Nao te lembras da tua password?{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/recover-password" as any)}
                >
                  <Text className="font-open-sans-semibold text-[14px] text-[#5C6CFF]">
                    Recupera-a
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </LightBackground>
  );
}
