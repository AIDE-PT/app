import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/buttons/button";
import { SocialButton } from "../components/buttons/socialButton";
import { Input } from "../components/input/Input";
import "../global.css";
import { LightBackground } from "@/components/DotBackground";
import { useTheme } from "@/hooks/useTheme";

// Divider with text
const DividerWithText = ({ text, isDark }: { text: string; isDark: boolean }) => (
  <View className="flex-row items-center my-6">
    <View className={`flex-1 h-[1px] ${isDark ? "bg-white/20" : "bg-[#D1D5DB]"}`} />
    <Text className={`font-open-sans text-[16px] mx-4 ${isDark ? "text-white/60" : "text-[#6B7280]"}`}>
      {text}
    </Text>
    <View className={`flex-1 h-[1px] ${isDark ? "bg-white/20" : "bg-[#D1D5DB]"}`} />
  </View>
);

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { isDark } = useTheme();

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
    <LightBackground>
      <View className="flex-1 px-4 pt-10">
        <SafeAreaView className="flex-1">
          <View className="flex-1">
          {/* Título e Subtítulo */}
          <View className="mt-12 mb-8">
            <Text className={`font-safiro text-[32px] ${isDark ? "text-white" : "text-[#1A1A2E]"}`}>
              Login
            </Text>
          </View>

          {/* Input Fields */}
          <View className="gap-4 mb-4">
            <Input
              variant="light"
              type="email"
              placeholder="Email/telemóvel"
              value={email}
              onChangeText={setEmail}
            />

            <Input
              variant="light"
              type="password"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Divider */}
          <DividerWithText text="Ou" isDark={isDark} />

          {/* Social Login Buttons */}
          <View className="gap-3 mb-10">
            <SocialButton provider="google" onPress={handleGoogleLogin} />

            <SocialButton provider="apple" onPress={handleAppleLogin} />
          </View>

          {/* Spacer */}
          <View className="flex-1" />

          {/* Bottom Section */}
          <View className="items-center mb-10">
            {/* Login Button */}
            <Button variant="primary" label="Avançar" onPress={handleLogin} />

            {/* Register Link */}
            <View className="flex-row mt-6">
              <Text className={`font-open-sans-semibold text-[14px] ${isDark ? "text-white/60" : "text-[#6B7280]"}`}>
                Não tem uma conta?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/register" as any)}>
                <Text className="font-open-sans-semibold text-[14px] text-[#5C6CFF]">
                  Regista-te
                </Text>
              </TouchableOpacity>
            </View>

            {/* Forgot Password Link */}
            <View className="flex-row mt-3">
              <Text className={`font-open-sans-semibold text-[14px] ${isDark ? "text-white/60" : "text-[#6B7280]"}`}>
                Não te lembras da tua password?{" "}
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
