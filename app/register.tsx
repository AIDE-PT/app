import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/buttons/button";
import { SocialButton } from "../components/buttons/socialButton";
import { Input } from "../components/input/Input";
import "../global.css";
import { LightBackground } from "@/components/DotBackground";
import {
  registerFieldCopy,
  RegisterFormData,
  registerSchema,
} from "@/schemas/register";

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

export default function Register() {
  const router = useRouter();
  const isDark = false;
  const withRequiredCue = (label: string) => `${label} *`;
  const {
    control,
    handleSubmit,
    formState: { errors, touchedFields, dirtyFields, isSubmitted },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      repeatPassword: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const shouldShowFieldError = (field: keyof RegisterFormData) =>
    !!errors[field] &&
    (isSubmitted || !!touchedFields[field] || !!dirtyFields[field]);

  const handleRegister = () => {
    router.push("/perfil");
  };

  const handleGoogleRegister = () => {
    console.log("Register with Google");
  };

  const handleAppleRegister = () => {
    console.log("Register with Apple");
  };

  return (
    <LightBackground forceLight>
      <View className="flex-1 px-4 pt-10">
        <SafeAreaView className="flex-1">
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
          >
            <View className="flex-1">
              <View className="mb-8 mt-12">
                <Text
                  className={`font-safiro text-[32px] ${
                    isDark ? "text-white" : "text-[#1A1A2E]"
                  }`}
                >
                  Registo
                </Text>
              </View>

              <View className="mb-4 gap-4">

                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      variant="light"
                      forceLight
                      type="text"
                      label={withRequiredCue(registerFieldCopy.name.label)}
                      placeholder={registerFieldCopy.name.placeholder}
                      helperText={registerFieldCopy.name.helperText}
                      errorText={
                        shouldShowFieldError("name")
                          ? errors.name?.message
                          : undefined
                      }
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      variant="light"
                      forceLight
                      type="email"
                      label={withRequiredCue(registerFieldCopy.email.label)}
                      placeholder={registerFieldCopy.email.placeholder}
                      helperText={registerFieldCopy.email.helperText}
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
                      label={withRequiredCue(registerFieldCopy.password.label)}
                      placeholder={registerFieldCopy.password.placeholder}
                      helperText={registerFieldCopy.password.helperText}
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

                <Controller
                  control={control}
                  name="repeatPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      variant="light"
                      forceLight
                      type="password"
                      label={withRequiredCue(registerFieldCopy.repeatPassword.label)}
                      placeholder={registerFieldCopy.repeatPassword.placeholder}
                      helperText={registerFieldCopy.repeatPassword.helperText}
                      errorText={
                        shouldShowFieldError("repeatPassword")
                          ? errors.repeatPassword?.message
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

              <View className="mb-6 gap-3">
                <SocialButton provider="google" onPress={handleGoogleRegister} forceLight />
                <SocialButton provider="apple" onPress={handleAppleRegister} forceLight />
              </View>

              <View className="flex-1" />

              <View className="mb-10 items-center">
                <Button
                  variant="primary"
                  forceLight
                  label="Registar"
                  onPress={handleSubmit(handleRegister)}
                />

                <View className="mt-6 flex-row">
                  <Text
                    className={`font-open-sans text-[14px] font-bold ${
                      isDark ? "text-white/60" : "text-[#6B7280]"
                    }`}
                  >
                    Ja tens uma conta?{" "}
                  </Text>
                  <TouchableOpacity onPress={() => router.push("/login")}>
                    <Text className="font-open-sans-semibold text-[14px] text-[#5C6CFF]">
                      Login
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </LightBackground>
  );
}
