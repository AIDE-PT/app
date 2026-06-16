import CalendarIcon from "@/components/svg/CalendarIcon";
import { useTheme } from "@/hooks/useTheme";
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity } from "react-native";

interface CalendarButtonProps {
  label?: string;
  onDateChange?: (date: Date) => void;
  onPress?: () => void;
}

export const CalendarButton = ({
  label = "Dia",
  onDateChange,
  onPress,
}: CalendarButtonProps) => {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const { isDark } = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (Platform.OS === "android") {
      showMode();
    } else {
      setShow(true);
    }
  };

  const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // No Android o picker fecha-se sozinho após seleção (dismissed ou set)
    setShow(Platform.OS === "ios");

    if (selectedDate) {
      setDate(selectedDate);
      if (onDateChange) onDateChange(selectedDate);
    }
  };

  const showMode = () => {
    DateTimePickerAndroid.open({
      value: date,
      onChange,
      mode: "date",
      display: "default",
    });
  };

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        style={styles.buttonShadow}
        className={`mx-1 flex-row items-center rounded-full border px-3 py-1.5 ${isDark ? "bg-[#1A1A2E] border-gray-700" : "bg-white border-gray-100"}`}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Abre a seleção de data."
      >
        <CalendarIcon size={18} color={isDark ? "#ffffff" : "#191915"} />
        <Text
          className={`ml-1.5 text-base font-medium ${isDark ? "text-white" : "text-black"}`}
        >
          {label}
        </Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={onChange}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  buttonShadow: {
    boxShadow: "0 1px 4px 0 rgba(0, 0, 0, 0.10)",
  },
});
