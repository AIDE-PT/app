import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { z } from "zod";
import { Input } from "./Input";

// 1. O SCHEMA ZOD (A Lógica de Validação)
const registerSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),

    email: z.string().refine((val) => {
      // Lógica original do teu regex para email OU telemóvel
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?\d{9,15}$/;
      const cleanPhone = val.replace(/\s/g, ""); // Limpa espaços para validar phone
      return emailRegex.test(val) || phoneRegex.test(cleanPhone);
    }, "Email ou telemóvel inválido"),

    password: z
      .string()
      .min(6, "Password deve ter pelo menos 6 caracteres")
      .regex(/\d/, "Password deve conter pelo menos um número")
      .regex(
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
        "Password deve conter pelo menos um caractere especial",
      ),

    repeatPassword: z.string(),
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: "As passwords não coincidem",
    path: ["repeatPassword"], // Isto associa o erro tecnicamente a este campo
  });

// Tipo automático do formulário
type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  // 2. SETUP DO REACT HOOK FORM
  const {
    control,
    handleSubmit,
    formState: { errors, touchedFields, dirtyFields, isSubmitted }, // O objeto que contém todos os erros atuais
    trigger,
    watch,
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

  const nameValue = watch("name");
  const emailValue = watch("email");
  const passwordValue = watch("password");
  const repeatPasswordValue = watch("repeatPassword");

  useEffect(() => {
    trigger("name");
  }, [nameValue, trigger]);

  useEffect(() => {
    trigger("email");
  }, [emailValue, trigger]);

  useEffect(() => {
    trigger("password");
  }, [passwordValue, trigger]);

  useEffect(() => {
    trigger("repeatPassword");
  }, [repeatPasswordValue, trigger]);

  const onSubmit = (data: RegisterFormData) => {
    console.log("Dados Válidos:", data);
    Alert.alert("Sucesso", "Registo efetuado com sucesso");
    // Aqui farias o reset() se quisesses limpar o form
  };

  // Esta função auxiliar transforma o objeto de erros do Hook Form numa lista (array)
  // para podermos fazer o .map() tal como tu tinhas no teu código original.
  const isFieldInteracted = (field: keyof RegisterFormData) => {
    return !!touchedFields[field] || !!dirtyFields[field];
  };

  const errorList = Object.entries(errors)
    .filter(
      ([field]) =>
        isSubmitted || isFieldInteracted(field as keyof RegisterFormData),
    )
    .map(([, err]) => err);

  return (
    <View className="p-4">
      <View className="relative">
        {/* INPUT NOME */}
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              value={value}
              onChangeText={(text) => onChange(text)}
              onBlur={onBlur}
              placeholder="Nome"
              type="text"
            />
          )}
        />

        <View className="mt-[16px]" />

        {/* INPUT EMAIL */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              value={value}
              onChangeText={(text) => onChange(text)}
              onBlur={onBlur}
              placeholder="Email/Telemóvel"
              type="email"
            />
          )}
        />

        <View className="mt-[16px]" />

        {/* INPUT PASSWORD */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              value={value}
              onChangeText={(text) => onChange(text)}
              onBlur={onBlur}
              placeholder="Password"
              type="password"
            />
          )}
        />

        <View className="mt-[16px]" />

        {/* INPUT REPEAT PASSWORD */}
        <Controller
          control={control}
          name="repeatPassword"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              value={value}
              onChangeText={(text) => onChange(text)}
              onBlur={onBlur}
              placeholder="Repetir Password"
              type="password"
            />
          )}
        />

        {/* --- ZONA DE ERROS (Mantendo o teu layout original) --- */}
        {/* Aqui convertemos os erros do Zod para a lista visual que tu querias */}
        {errorList.length > 0 && (
          <View className="absolute top-full mt-2 w-full px-4">
            {errorList.map((error: any, index) => (
              <Text key={index} className="text-red-500 text-sm mb-1">
                • {error.message}
              </Text>
            ))}
          </View>
        )}
      </View>

      <View className="mt-[250px]" />

      <TouchableOpacity
        onPress={handleSubmit(onSubmit)}
        className="bg-white/75 h-[57px] rounded-[20px] items-center justify-center mx-12"
        style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
      >
        <Text className="text-black text-[24px] font-bold">Registar</Text>
      </TouchableOpacity>
    </View>
  );
}
