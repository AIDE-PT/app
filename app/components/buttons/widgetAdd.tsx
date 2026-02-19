import { Text, TouchableOpacity, View } from "react-native";
import { SvgProps } from "react-native-svg";
import { useTheme } from "@/hooks/useTheme";

interface WidgetAddProps {
  label: string;
  Icon: React.FC<SvgProps & { size?: number; color?: string }>;
  onPress: () => void;
}

export const WidgetAdd = ({ label, Icon, onPress }: WidgetAddProps) => {
  const { isDark } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`rounded-[20px] w-[100px] h-[100px] font-safiro items-center justify-center m-1 ${isDark ? "bg-white/10 border border-white/10" : "bg-white"}`}
      activeOpacity={0.7}
      style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
    >
      <View className="mb-2">
        <Icon size={32} color={isDark ? "#FFFFFF" : "#000746"} />
      </View>
      <Text className={`font-bold text-[18px] uppercase font-open-sans ${isDark ? "text-white" : "text-[#000000]"}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};
