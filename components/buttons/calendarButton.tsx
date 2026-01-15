import CalendarIcon from "@/components/svg/CalendarIcon";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface CalendarButtonProps {
  label?: string;
  onPress?: () => void;
}

export const CalendarButton = ({
  label = "Dia",
  onPress,
}: CalendarButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.buttonShadow}
      className="flex-row items-center bg-white px-4 py-2 rounded-full border border-gray-100 self-start ml-4"
    >
      <CalendarIcon />
      <Text className="ml-2 text-xl font-semibold text-black">{label}</Text>
    </TouchableOpacity>
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
