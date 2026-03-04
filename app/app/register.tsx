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

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { isDark } = useTheme();

  const handleRegister = () => {
    // Validate passwords match
    if (password !== confirmPassword) {
      console.log("Passwords don't match");
      return;
    }
    // Handle registration logic
    router.push("/perfil");
  };

  const handleGoogleRegister = () => {
    console.log("Register with Google");
  };

  const handleAppleRegister = () => {
    console.log("Register with Apple");
  };

  return (
    <LightBackground>
      <View className="flex-1 px-4 pt-10">
        <SafeAreaView className="flex-1">
          <View className="flex-1">
          {/* Título e Subtítulo */}
          <View className="mt-12 mb-8">
            <Text className={`font-safiro text-[32px] ${isDark ? "text-white" : "text-[#1A1A2E]"}`}>
              Registo
            </Text>
          </View>

          {/* Input Fields */}
          <View className="gap-4 mb-4">
            <Input
              variant="light"
              type="text"
              placeholder="Nome"
              value={name}
              onChangeText={setName}
            />

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

            <Input
              variant="light"
              type="password"
              placeholder="Repetir Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          {/* Divider */}
          <DividerWithText text="Ou" isDark={isDark} />

          {/* Social Registration Buttons */}
          <View className="gap-3 mb-6">
            <SocialButton provider="google" onPress={handleGoogleRegister} />

            <SocialButton provider="apple" onPress={handleAppleRegister} />
          </View>

          {/* Spacer */}
          <View className="flex-1" />

          {/* Bottom Section */}
          <View className="items-center mb-10">
            {/* Register Button */}
            <Button
              variant="primary"
              label="Registar"
              onPress={handleRegister}
            />

            {/* Login Link */}
            <View className="flex-row mt-6">
              <Text className={`font-open-sans font-bold text-[14px] ${isDark ? "text-white/60" : "text-[#6B7280]"}`}>
                Já tens uma conta?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/login")}>
                <Text className="font-open-sans-semibold text-[14px] text-[#5C6CFF]">
                  Login
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
