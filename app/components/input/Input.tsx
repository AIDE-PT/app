import React, { useState } from "react";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import CalendarIcon from "../svg/CalendarIcon";
import EyeIcon from "../svg/EyeIcon";

import {
  Platform,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface InputDTO extends TextInputProps {
  variant?: "light" | "dark";
  type?: "text" | "password" | "date" | "email";
  dateValue?: Date;
  onDateChange?: (date: Date) => void;
  suffix?: string;
}

export const Input = ({
  variant = "light",
  type = "text",
  dateValue,
  onDateChange,
  suffix,
  ...props
}: InputDTO) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDate, setCurrentDate] = useState(dateValue || new Date());
  const [isEmailValid, setIsEmailValid] = useState(true);
  const { isDark } = useTheme();

  // When variant is 'light' but we're in dark mode, use dark styling
  const useDarkStyling = variant === "dark" || (variant === "light" && isDark);
  const isPassword = type === "password";
  const isDate = type === "date";
  const isEmail = type === "email";

  const formattedDate = currentDate.toLocaleDateString("pt-PT");

  // Validação de e-mail simples (Regex)
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = regex.test(email);
    setIsEmailValid(isValid || email.length === 0);
    if (props.onChangeText) props.onChangeText(email);
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setCurrentDate(selectedDate);
      if (onDateChange) onDateChange(selectedDate);
    }
  };

  return (
    <View className="w-full">
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => isDate && setShowDatePicker(true)}
        className={`w-full flex-row items-center px-5 py-0.5 rounded-[20px]
                    ${!isEmailValid ? "border border-red-500/50" : ""} 
                    ${useDarkStyling ? "bg-aide-dark-card" : "bg-white/75"}`}
        style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
      >
        <TextInput
          className={`flex-1 h-11 text-base ${useDarkStyling ? "text-white" : "text-black/90"}`}
          placeholderTextColor={
            useDarkStyling ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"
          }
          autoCapitalize={isEmail ? "none" : props.autoCapitalize}
          autoCorrect={isEmail ? false : props.autoCorrect}
          keyboardType={
            isEmail ? "email-address" : isDate ? "numeric" : props.keyboardType
          }
          onChangeText={isEmail ? validateEmail : props.onChangeText}
          secureTextEntry={isPassword && !showPassword}
          editable={!isDate}
          value={isDate ? formattedDate : props.value}
          pointerEvents={isDate ? "none" : "auto"}
          {...props}
        />

        {suffix && (
          <Text
            className={`ml-2 text-base ${useDarkStyling ? "text-white/60" : "text-black/60"}`}
          >
            {suffix}
          </Text>
        )}

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="ml-2"
          >
            <EyeIcon
              variant={showPassword ? "open" : "close"}
              size={20}
              fill={useDarkStyling ? "white" : "#111111"}
            />
          </TouchableOpacity>
        )}

        {isDate && (
          <View className="ml-2">
            <CalendarIcon />
          </View>
        )}
      </TouchableOpacity>
      {/* Feedback visual de erro */}
      {isEmail && !isEmailValid && (
        <Text className="text-red-500 text-[10px] ml-4 mt-1 font-bold">
          E-mail inválido
        </Text>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};
