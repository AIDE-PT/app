import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface IconCardButtonProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: "light" | "dark";
  forceLight?: boolean;
  showSelectedCheck?: boolean;
}

export const IconCardButton = ({
  label,
  selected = false,
  onPress,
  icon,
  variant = "light",
  forceLight = false,
  showSelectedCheck = false,
}: IconCardButtonProps) => {
  const isDark = variant === "dark";
  const { isDark: isDarkTheme } = useTheme();
  const isDarkMode = !forceLight && (isDark || isDarkTheme);

  // Wrapper to modify icon color for dark mode
  const IconWrapper = ({ children }: { children: React.ReactNode }) => {
    if (!children) return children;
    
    // Check if it's a valid React element with props
    const child = children as React.ReactElement<any>;
    if (child && child.props) {
      // Clone the element with white color and thicker stroke
      return React.cloneElement(child, {
        color: isDarkMode ? "#FFFFFF" : child.props.color,
        strokeWidth: isDarkMode ? 3.5 : (child.props.strokeWidth || 2.5),
      });
    }
    return children;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.card,
        selected 
          ? (isDarkMode ? styles.darkSelectedBorder : styles.selectedBorder)
          : (isDarkMode ? styles.darkUnselectedBorder : styles.defaultBorder),
        selected 
          ? (isDarkMode ? styles.darkCard : styles.defaultCard)
          : (isDarkMode ? styles.darkCard : styles.defaultCard),
      ]}
    >
      {selected && showSelectedCheck ? (
        <View
          style={[
            styles.checkBadge,
            isDarkMode ? styles.darkCheckBadge : styles.lightCheckBadge,
          ]}
          pointerEvents="none"
          accessible={false}
        >
          <Ionicons
            name="checkmark"
            size={18}
            color={isDarkMode ? styles.darkCheckText.color : styles.lightCheckText.color}
          />
        </View>
      ) : null}

      <View style={styles.iconContainer}>
        <IconWrapper>{icon}</IconWrapper>
      </View>
      <Text style={[styles.label, isDarkMode && styles.darkLabel]}>{label}</Text>
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
    position: "relative",
  },
  defaultCard: {
    backgroundColor: "#FFFFFF",
  },
  darkCard: {
    backgroundColor: "rgba(0, 4, 18, 0.9)",
  },
  defaultBorder: {
    borderColor: "rgba(80, 97, 255, 0.15)",
    boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
  },
  darkUnselectedBorder: {
    borderColor: "transparent",
    boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.3)",
  },
  selectedBorder: {
    borderColor: "#0400FF",
    boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
  },
  darkSelectedBorder: {
    borderColor: "#0400FF",
    boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.3)",
  },
  iconContainer: {
    marginBottom: 8,
  },
  checkBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  lightCheckBadge: {
    backgroundColor: "#EEF2FF",
    borderColor: "#0400FF",
  },
  darkCheckBadge: {
    backgroundColor: "rgba(4, 0, 255, 0.24)",
    borderColor: "#0400FF",
  },
  lightCheckText: {
    color: "#0400FF",
  },
  darkCheckText: {
    color: "#0400FF",
  },
  label: {
    fontFamily: "OpenSans-SemiBold",
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
  },
  darkLabel: {
    color: "#FFFFFF",
  },
});
