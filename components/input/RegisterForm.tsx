import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import {
  registerFieldCopy,
  RegisterFormData,
  registerSchema,
} from "@/schemas/register";
import { Input } from "./Input";

export default function RegisterForm() {
  const {
    control,
    handleSubmit,
    formState: { errors, touchedFields, dirtyFields, isSubmitted },
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

  const isFieldInteracted = (field: keyof RegisterFormData) =>
    !!touchedFields[field] || !!dirtyFields[field];

  const shouldShowFieldError = (field: keyof RegisterFormData) =>
    !!errors[field] && (isSubmitted || isFieldInteracted(field));

  const onSubmit = (data: RegisterFormData) => {
    console.log("Dados validos:", data);
    Alert.alert("Sucesso", "Registo efetuado com sucesso");
  };

  return (
    <View className="p-4">
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value, onBlur } }) => (
          <Input
            label={registerFieldCopy.name.label}
            helperText={registerFieldCopy.name.helperText}
            errorText={
              shouldShowFieldError("name") ? errors.name?.message : undefined
            }
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={registerFieldCopy.name.placeholder}
            type="text"
          />
        )}
      />

      <View className="mt-4" />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value, onBlur } }) => (
          <Input
            label={registerFieldCopy.email.label}
            helperText={registerFieldCopy.email.helperText}
            errorText={
              shouldShowFieldError("email") ? errors.email?.message : undefined
            }
            validateAs="emailOrPhone"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={registerFieldCopy.email.placeholder}
            type="email"
          />
        )}
      />

      <View className="mt-4" />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value, onBlur } }) => (
          <Input
            label={registerFieldCopy.password.label}
            helperText={registerFieldCopy.password.helperText}
            errorText={
              shouldShowFieldError("password")
                ? errors.password?.message
                : undefined
            }
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={registerFieldCopy.password.placeholder}
            type="password"
          />
        )}
      />

      <View className="mt-4" />

      <Controller
        control={control}
        name="repeatPassword"
        render={({ field: { onChange, value, onBlur } }) => (
          <Input
            label={registerFieldCopy.repeatPassword.label}
            helperText={registerFieldCopy.repeatPassword.helperText}
            errorText={
              shouldShowFieldError("repeatPassword")
                ? errors.repeatPassword?.message
                : undefined
            }
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={registerFieldCopy.repeatPassword.placeholder}
            type="password"
          />
        )}
      />

      <View className="mt-8" />

      <TouchableOpacity
        onPress={handleSubmit(onSubmit)}
        className="mx-12 h-[57px] items-center justify-center rounded-[20px] bg-white/75"
        style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
      >
        <Text className="text-[24px] font-bold text-black">Registar</Text>
      </TouchableOpacity>
    </View>
  );
}
