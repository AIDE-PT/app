import CalendarIcon from "@/components/svg/CalendarIcon";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, Platform } from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useTheme } from "@/hooks/useTheme";

interface CalendarButtonProps {
  label?: string;
  onDateChange?: (date: Date) => void;
}

export const CalendarButton = ({
  label = "Dia",
  onDateChange,
}: CalendarButtonProps) => {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const { isDark } = useTheme();

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
        onPress={Platform.OS === "android" ? showMode : () => setShow(true)}
        style={styles.buttonShadow}
        className={`flex-row items-center px-4 py-2 rounded-full border self-start ml-4 ${isDark ? "bg-[#1A1A2E] border-gray-700" : "bg-white border-gray-100"}`}
      >
        <CalendarIcon color={isDark ? "#ffffff" : "#191915"} />
        <Text className={`ml-2 text-xl font-semibold ${isDark ? "text-white" : "text-black"}`}>{label}</Text>
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
    boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
  },
});
