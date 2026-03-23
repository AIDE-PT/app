import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface MainDetailsProps {
  value?: number;
  unit?: string;
  status?: "normal" | "warning" | "alert";
  statusLabel?: string;
  statusBgColor?: string;
  statusTextColor?: string;
  max?: number;
  min?: number;
}

const MainDetails = ({
  value = 72,
  unit = "bpm",
  status = "normal",
  statusLabel,
  statusBgColor,
  statusTextColor,
  max = 167,
  min = 70,
}: MainDetailsProps) => {
  const { isDark, colors } = useTheme();
  const resolvedStatusBg = statusBgColor ?? colors.semantic.success;
  const resolvedStatusText = statusTextColor ?? (isDark ? "#001018" : "#063B1A");

  const badgeIcon = status === "normal" ? "smile" : status === "warning" ? "alert-circle" : "alert-triangle";
  const resolvedLabel = statusLabel ?? status;

  return (
    <View
      className={`rounded-3xl px-8 py-6 flex-row justify-between items-center w-full border ${isDark ? "bg-aide-dark-card border-white/10" : "bg-white border-gray-100"}`}
      style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
    >
      {/* Left Section */}
      <View className="flex-col justify-center gap-4">
        <View className="flex-row items-baseline">
          <Text className={`text-[96px] leading-[96px] font-bold font-open-sans tracking-tighter ${isDark ? "text-white" : "text-black"}`}>
            {value}
          </Text>
          <Text className={`text-2xl font-medium font-open-sans ml-1 ${isDark ? "text-white" : "text-black"}`}>
            {unit}
          </Text>
        </View>

        <View
          className="self-start px-5 py-2 rounded-full flex-row items-center gap-2"
          style={{ backgroundColor: resolvedStatusBg }}
          accessibilityRole="text"
          accessibilityLabel={`Estado ${resolvedLabel}`}
        >
          <Feather name={badgeIcon as any} size={24} color={resolvedStatusText} accessible={false} />
          <Text className="text-xl font-open-sans font-medium pb-1" style={{ color: resolvedStatusText }}>
            {resolvedLabel}
          </Text>
        </View>
      </View>

      {/* Right Section */}
      <View className="flex-col items-end justify-center py-2 ml-4 gap-2">
        {/* Max */}
        <View className="items-end gap-1">
          <View className="flex-row items-baseline">
            <Text className="text-4xl font-bold font-open-sans-semibold" style={{ color: colors.semantic.danger }}>
              {max}
            </Text>
            <Text className="text-lg font-medium ml-1" style={{ color: colors.semantic.danger }}>
              {unit}
            </Text>
          </View>
          <Text className={`text-black text-xl font-open-sans ${isDark ? "text-white/60" : "text-black"}`}>Máximo</Text>
        </View>

        {/* Divider - using a View as a line */}
        <View className={`h-[3px] w-16 my-4 ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />

        {/* Min */}
        <View className="items-end gap-1">
          <View className="flex-row items-baseline">
            <Text className="text-4xl font-bold font-open-sans-semibold" style={{ color: colors.semantic.success }}>
              {min}
            </Text>
            <Text className="text-lg font-medium ml-1" style={{ color: colors.semantic.success }}>
              {unit}
            </Text>
          </View>
          <Text className={`text-black text-xl font-open-sans ${isDark ? "text-white/60" : "text-black"}`}>Mínimo</Text>
        </View>
      </View>
    </View>
  );
};

export default MainDetails;
