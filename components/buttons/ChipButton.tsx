import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ChipButtonProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  variant?: "light" | "dark";
}

export const ChipButton = ({
  label,
  selected = false,
  onPress,
  variant = "light",
}: ChipButtonProps) => {
  const isDarkVariant = variant === "dark";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1}
      style={styles.chipShadow}
      className={`flex-row items-center px-4 py-2 rounded-full border border-[#5061FF]/20
                  ${isDarkVariant ? "bg-black/60" : "bg-white/90"}`}
    >
      <View
        className={`w-4 h-4 rounded-full border-2 mr-2 items-center justify-center
                    ${
                      selected
                        ? "border-black/90"
                        : isDarkVariant
                          ? "border-white/40"
                          : "border-black/40"
                    }`}
      >
        {selected && (
          <View
            className={`w-2 h-2 rounded-full ${
              isDarkVariant ? "bg-white" : "bg-black/90"
            }`}
          />
        )}
      </View>

      <Text
        className={`text-sm ${isDarkVariant ? "text-white" : "text-black/90"}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chipShadow: {
    boxShadow: "0 0 50px -20px #5061FF inset",
  },
});
