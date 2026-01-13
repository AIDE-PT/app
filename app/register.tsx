import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/buttons/button";
import { GradientBackground } from "../components/GradientBackground";
import { Input } from "../components/input/Input";
import "../global.css";

// Divider with text
// const DividerWithText = ({ text }: { text: string }) => (
//   <View className="flex-row items-center my-6">
//     <View className="flex-1 h-[1px] bg-[#D1D5DB]" />
//     <Text className="font-open-sans text-[16px] text-[#6B7280] mx-4">
//       {text}
//     </Text>
//     <View className="flex-1 h-[1px] bg-[#D1D5DB]" />
//   </View>
// );

export default function Register() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    "Safiro-Medium": require("../assets/fonts/safiro/safiro-medium-webfont.ttf"),
    "OpenSans-Regular": require("../assets/fonts/open-sans/OpenSans-Regular.ttf"),
    "OpenSans-SemiBold": require("../assets/fonts/open-sans/OpenSans-SemiBold.ttf"),
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!fontsLoaded) {
    return null;
  }

  const handleRegister = () => {
    // Validate passwords match
    if (password !== confirmPassword) {
      console.log("Passwords don't match");
      return;
    }
    // Handle registration logic
    console.log("Register with:", { name, email, password });
  };

  // const handleGoogleRegister = () => {
  //     console.log("Register with Google");
  // };

  // const handleAppleRegister = () => {
  //     console.log("Register with Apple");
  // };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 pt-10">
          {/* Title */}
          <Text className="font-safiro text-[32px] text-[#1A1A2E] mb-10">
            Registo
          </Text>

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

          {/* Divider - Social Registration (commented for now)
                    <DividerWithText text="Ou" />

                    <View className="gap-3 mb-6">
                        <SocialButton
                            provider="google"
                            onPress={handleGoogleRegister}
                        />

                        <SocialButton
                            provider="apple"
                            onPress={handleAppleRegister}
                        />
                    </View>
                    */}

          {/* Spacer */}
          <View className="flex-1" />

          {/* Bottom Section */}
          <View className="items-center pb-8">
            {/* Register Button */}
            <Button
              variant="primary"
              label="Registar"
              onPress={handleRegister}
            />

            {/* Login Link */}
            <View className="flex-row mt-6">
              <Text className="font-open-sans text-[14px] text-[#6B7280]">
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
    </GradientBackground>
  );
}
