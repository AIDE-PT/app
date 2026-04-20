import { useTheme } from "@/hooks/useTheme";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Audio } from "expo-av";
import { AlertCircle, Info } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import CalendarIcon from "../svg/CalendarIcon";
import EyeIcon from "../svg/EyeIcon";

interface InputDTO extends TextInputProps {
  variant?: "light" | "dark";
  forceLight?: boolean;
  type?: "text" | "password" | "date" | "email";
  dateValue?: Date;
  onDateChange?: (date: Date) => void;
  suffix?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
  validateAs?: "none" | "email" | "emailOrPhone";
}

export const Input = ({
  variant = "light",
  forceLight = false,
  type = "text",
  dateValue,
  onDateChange,
  suffix,
  label,
  helperText,
  errorText,
  validateAs,
  ...props
}: InputDTO) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showHelper, setShowHelper] = useState(false);
  const [currentDate, setCurrentDate] = useState(dateValue || new Date());
  const [isInputValid, setIsInputValid] = useState(true);
  const errorSoundRef = useRef<Audio.Sound | null>(null);
  const previousErrorRef = useRef<string | undefined>(undefined);
  const { isDark } = useTheme();

  const useDarkStyling =
    !forceLight && (variant === "dark" || (variant === "light" && isDark));
  const isPassword = type === "password";
  const isDate = type === "date";
  const isEmail = type === "email";
  const effectiveValidation = validateAs ?? (isEmail ? "email" : "none");
  const formattedDate = currentDate.toLocaleDateString("pt-PT");

  const validateText = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?\d{9,15}$/;
    const cleanValue = text.replace(/\s/g, "");

    const isValid =
      effectiveValidation === "email"
        ? emailRegex.test(text)
        : effectiveValidation === "emailOrPhone"
          ? emailRegex.test(text) || phoneRegex.test(cleanValue)
          : true;

    setIsInputValid(isValid || text.length === 0);
    props.onChangeText?.(text);
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setCurrentDate(selectedDate);
      onDateChange?.(selectedDate);
    }
  };

  const internalErrorText =
    effectiveValidation !== "none" && !isInputValid
      ? effectiveValidation === "emailOrPhone"
        ? "Introduza um email ou telemovel valido."
        : "Introduza um email valido."
      : undefined;
  const resolvedErrorText = errorText || internalErrorText;
  const helperHint = helperText
    ? "Toque no icone de informacao ao lado do titulo para ver ajuda."
    : undefined;
  const accessibilityHint = resolvedErrorText || helperText || helperHint;

  useEffect(() => {
    let isMounted = true;

    const loadErrorSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("../../assets/audio/error_feedback.mp3"),
          { shouldPlay: false },
        );

        if (isMounted) {
          errorSoundRef.current = sound;
        } else {
          await sound.unloadAsync();
        }
      } catch {
        errorSoundRef.current = null;
      }
    };

    loadErrorSound();

    return () => {
      isMounted = false;
      if (errorSoundRef.current) {
        void errorSoundRef.current.unloadAsync();
        errorSoundRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const announceAndPlayError = async () => {
      if (!resolvedErrorText || resolvedErrorText === previousErrorRef.current) {
        previousErrorRef.current = resolvedErrorText;
        return;
      }

      AccessibilityInfo.announceForAccessibility(resolvedErrorText);

      if (!errorSoundRef.current) {
        previousErrorRef.current = resolvedErrorText;
        return;
      }

      try {
        await errorSoundRef.current.setPositionAsync(0);
        await errorSoundRef.current.playAsync();
      } catch {
        // Keep form validation accessible even when audio playback fails.
      }

      previousErrorRef.current = resolvedErrorText;
    };

    void announceAndPlayError();
  }, [resolvedErrorText]);

  return (
    <View className="w-full">
      {label ? (
        <View className="mb-2 ml-1 flex-row items-center">
          <Text
            className={`text-sm font-semibold ${
              useDarkStyling ? "text-white" : "text-black/80"
            }`}
            accessibilityLanguage="pt-PT"
          >
            {label}
          </Text>
          {helperText ? (
            <TouchableOpacity
              onPress={() => setShowHelper((current) => !current)}
              className={`ml-2 h-5 w-5 items-center justify-center rounded-full border ${
                useDarkStyling
                  ? "border-white/35 bg-white/12"
                  : "border-black/20 bg-black/[0.06]"
              }`}
              accessibilityRole="button"
              accessibilityLabel={`Informacao sobre ${label}`}
              accessibilityHint={
                showHelper ? "Ocultar ajuda deste campo." : helperHint
              }
              accessibilityLanguage="pt-PT"
            >
              <Info
                size={12}
                color={useDarkStyling ? "rgba(255,255,255,0.85)" : "#374151"}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {showHelper && helperText ? (
        <View
          className={`mb-2 ml-1 rounded-xl px-3 py-2 ${
            useDarkStyling ? "bg-white/8" : "bg-black/[0.04]"
          }`}
        >
          <Text
            className={`font-open-sans text-[13px] leading-5 ${
              useDarkStyling ? "text-white/85" : "text-black/75"
            }`}
            accessibilityLanguage="pt-PT"
          >
            {helperText}
          </Text>
        </View>
      ) : null}

      <TouchableOpacity
        activeOpacity={1}
        onPress={() => isDate && setShowDatePicker(true)}
        className={`w-full flex-row items-center rounded-[20px] px-5 py-0.5 ${
          resolvedErrorText
            ? "border border-red-500"
            : "border border-transparent"
        } ${useDarkStyling ? "bg-aide-dark-card" : "bg-white/75"}`}
        style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
      >
        <TextInput
          className={`flex-1 h-11 text-base ${
            useDarkStyling ? "text-white" : "text-black/90"
          }`}
          placeholderTextColor={
            useDarkStyling ? "rgba(255,255,255,0.62)" : "rgba(17,24,39,0.55)"
          }
          autoCapitalize={isEmail ? "none" : props.autoCapitalize}
          autoCorrect={
            effectiveValidation !== "none" ? false : props.autoCorrect
          }
          keyboardType={
            isEmail ? "email-address" : isDate ? "numeric" : props.keyboardType
          }
          onChangeText={
            effectiveValidation !== "none" ? validateText : props.onChangeText
          }
          secureTextEntry={isPassword && !showPassword}
          editable={!isDate}
          value={isDate ? formattedDate : props.value}
          pointerEvents={isDate ? "none" : "auto"}
          accessibilityLabel={
            props.accessibilityLabel ?? label ?? props.placeholder
          }
          accessibilityHint={props.accessibilityHint ?? accessibilityHint}
          accessibilityLanguage="pt-PT"
          accessibilityState={{
            disabled: props.editable === false || isDate,
          }}
          {...props}
        />

        {suffix ? (
          <Text
            className={`ml-2 text-base ${
              useDarkStyling ? "text-white/75" : "text-black/70"
            }`}
            accessibilityLanguage="pt-PT"
          >
            {suffix}
          </Text>
        ) : null}

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="ml-2"
            accessibilityRole="button"
            accessibilityLabel={
              showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"
            }
            accessibilityHint="Alterna a visibilidade da palavra-passe."
            accessibilityLanguage="pt-PT"
          >
            <EyeIcon
              variant={showPassword ? "open" : "close"}
              size={20}
              fill={useDarkStyling ? "white" : "#111111"}
            />
          </TouchableOpacity>
        ) : null}

        {isDate ? (
          <View className="ml-2" accessible={false}>
            <CalendarIcon />
          </View>
        ) : null}
      </TouchableOpacity>

      {resolvedErrorText ? (
        <View
          className="mt-1 ml-1 flex-row items-start"
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          accessibilityLanguage="pt-PT"
        >
          <AlertCircle
            size={13}
            color={useDarkStyling ? "#FCA5A5" : "#B91C1C"}
            style={{ marginTop: 2 }}
          />
          <Text
            className={`ml-1.5 flex-1 text-xs ${
              useDarkStyling ? "text-red-200" : "text-red-600"
            }`}
            accessibilityLiveRegion="assertive"
            accessibilityLanguage="pt-PT"
          >
            {resolvedErrorText}
          </Text>
        </View>
      ) : null}

      {showDatePicker ? (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
        />
      ) : null}
    </View>
  );
};
