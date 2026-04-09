import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { Button } from "../components/buttons/button";
import { SocialButton } from "../components/buttons/socialButton";
import { Input } from "../components/input/Input";
import "../global.css";
import { LightBackground } from "@/components/DotBackground";
import { supabase } from "@/utils/supabase/client";

const loginSchema = z.object({
  email: z.string().min(1, "Email obrigatório").email("Email inválido"),
  password: z.string().min(1, "Password obrigatória"),
});

type LoginFormData = z.infer<typeof loginSchema>;

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
      className={`mx-4 font-open-sans text-[16px] ${isDark ? "text-white/60" : "text-[#6B7280]"
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
  const isDark = false;
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, touchedFields, dirtyFields, isSubmitted },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const shouldShowFieldError = (field: keyof LoginFormData) =>
    !!errors[field] &&
    (isSubmitted || !!touchedFields[field] || !!dirtyFields[field]);

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      console.log("ERRO:", JSON.stringify(error));
      console.log("DATA:", JSON.stringify(data));

      if (error) {
        const messages: Record<string, string> = {
          "Invalid login credentials": "Email ou password incorrectos.",
          "Email not confirmed": "Confirma o teu email antes de fazer login.",
          "Too many requests": "Demasiadas tentativas. Aguarda alguns minutos.",
          "Failed to fetch": "Sem ligação à internet. Verifica a tua rede.",
        };

        const msg = messages[error.message] ?? error.message;
        Alert.alert("Erro no Login", msg, [{ text: "OK" }]);
      } else {
        router.push("/testDashboard" as any);
      }
    } finally {
      setIsLoading(false);
    }
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
                className={`font-safiro text-[32px] ${isDark ? "text-white" : "text-[#1A1A2E]"
                  }`}
              >
                Login
              </Text>
            </View>

            <View className="mb-4 gap-4">
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    variant="light"
                    forceLight
                    type="email"
                    label="Email ou telemovel"
                    placeholder="Email/telemovel"
                    helperText="Introduza o email ou numero usado no registo."
                    errorText={
                      shouldShowFieldError("email")
                        ? errors.email?.message
                        : undefined
                    }
                    validateAs="emailOrPhone"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    variant="light"
                    forceLight
                    type="password"
                    label="Password"
                    placeholder="Password"
                    helperText="Escreva a password da sua conta."
                    errorText={
                      shouldShowFieldError("password")
                        ? errors.password?.message
                        : undefined
                    }
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                  />
                )}
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
                onPress={handleSubmit(handleLogin)}
                loading={isLoading}
              />

              <View className="mt-6 flex-row">
                <Text
                  className={`font-open-sans-semibold text-[14px] ${isDark ? "text-white/60" : "text-[#6B7280]"
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
                  className={`font-open-sans-semibold text-[14px] ${isDark ? "text-white/60" : "text-[#6B7280]"
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
