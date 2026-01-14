import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface IconCardButtonProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
}

export const IconCardButton = ({
  label,
  selected = false,
  onPress,
  icon,
}: IconCardButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.card, selected ? styles.selectedCard : styles.defaultCard]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    minWidth: 140,
    minHeight: 100,
    borderWidth: 2,
  },
  defaultCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(80, 97, 255, 0.15)",
  },
  selectedCard: {
    backgroundColor: "#DDEEF9",
    borderColor: "#7C89FF",
  },
  iconContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1F36",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
