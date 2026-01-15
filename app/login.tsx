import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/buttons/button";
import { SocialButton } from "../components/buttons/socialButton";
import { Input } from "../components/input/Input";
import "../global.css";

// Divider with text
const DividerWithText = ({ text }: { text: string }) => (
  <View className="flex-row items-center my-6">
    <View className="flex-1 h-[1px] bg-[#D1D5DB]" />
    <Text className="font-open-sans text-[16px] text-[#6B7280] mx-4">
      {text}
    </Text>
    <View className="flex-1 h-[1px] bg-[#D1D5DB]" />
  </View>
);

export default function Login() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    "Safiro-Medium": require("../assets/fonts/safiro/safiro-medium-webfont.ttf"),
    "OpenSans-Regular": require("../assets/fonts/open-sans/OpenSans-Regular.ttf"),
    "OpenSans-SemiBold": require("../assets/fonts/open-sans/OpenSans-SemiBold.ttf"),
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!fontsLoaded) {
    return null;
  }

  const handleLogin = () => {
    // Handle login logic
    console.log("Login with:", email, password);
  };

  const handleGoogleLogin = () => {
    console.log("Login with Google");
  };

  const handleAppleLogin = () => {
    console.log("Login with Apple");
  };

  return (
    <View className="flex-1 px-4 pt-10 bg-aide-background">
      <SafeAreaView className="flex-1">
        <View className="flex-1">
          {/* Título e Subtítulo */}
          <View className="mt-12 mb-8">
            <Text className="font-safiro text-[32px] text-[#1A1A2E]">
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
          <DividerWithText text="Ou" />

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
              <Text className="font-open-sans font-semi-bold text-[14px] text-[#6B7280]">
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
              <Text className="font-open-sans font-semi-bold text-[14px] text-[#6B7280]">
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
  );
}
