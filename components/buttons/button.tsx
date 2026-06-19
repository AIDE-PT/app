import { Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { getSurfaceStyle } from "@/components/surface/surfaceStyles";

interface buttonDTO {
  variant: "primary" | "primaryDark" | "list" | "listDark";
  label: string;
  onPress: () => void;
  disabled?: boolean;
  forceLight?: boolean;
  loading?: boolean;
}

export const Button = ({
  variant = "primary",
  label,
  onPress,
  disabled = false,
  forceLight = false,
  loading = false,
}: buttonDTO) => {
  const { isDark } = useTheme();
  const useDarkMode = !forceLight && isDark;

  const containerVariants = {
    primary: "items-center w-[242px]",
    primaryDark: "items-center w-[242px]",
    list: "items-start",
    listDark: "items-start",
  };

  const variantUsesDarkSurface =
    variant === "primaryDark" || variant === "listDark" || useDarkMode;

  const textVariants = {
    primary: `font-open-sans text-[20px] font-bold ${useDarkMode ? "text-white" : "text-black/90"}`,
    list: `font-open-sans text-[20px] mx-2 ${useDarkMode ? "text-white" : "text-black/90"}`,
    primaryDark: "font-open-sans text-[20px] font-bold text-white",
    listDark: "font-open-sans text-[20px] mx-2 text-white",
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`p-3 ${disabled || loading ? "opacity-50" : ""}
                 ${containerVariants[variant]}`}
      style={getSurfaceStyle("elevated", variantUsesDarkSurface)}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityLanguage="pt-PT"
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={useDarkMode ? "white" : "black"}
        />
      ) : (
        <Text
          className={`text-center mx-auto ${textVariants[variant]}`}
          accessibilityLanguage="pt-PT"
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};
