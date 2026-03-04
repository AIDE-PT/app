import CalendarIcon from "@/components/svg/CalendarIcon";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, Platform } from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

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
        className="flex-row items-center bg-white px-4 py-2 rounded-full border border-gray-100 self-start ml-4"
      >
        <CalendarIcon />
        <Text className="ml-2 text-xl font-semibold text-black">{label}</Text>
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
