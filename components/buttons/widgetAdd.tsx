import { useTheme } from "@/hooks/useTheme";
import { Text, TouchableOpacity, View } from "react-native";
import { SvgProps } from "react-native-svg";

interface WidgetAddProps {
  label: string;
  Icon: React.FC<SvgProps & { size?: number; color?: string }>;
  onPress: () => void;
  width?: number;
}

export const WidgetAdd = ({
  label,
  Icon,
  onPress,
  width = 104,
}: WidgetAddProps) => {
  const { isDark } = useTheme();
  const iconSize = width < 96 ? 26 : width < 112 ? 30 : 32;
  const labelSizeClass = width < 96 ? "text-[14px]" : "text-[16px]";

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`rounded-[20px] font-safiro items-center justify-center ${isDark ? "bg-white/10 border border-white/10" : "bg-white"}`}
      activeOpacity={0.7}
      style={{
        width,
        minHeight: width,
        boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
      }}
      accessibilityRole="button"
      accessibilityLabel={`Adicionar widget ${label}`}
      accessibilityHint="Adiciona este widget ao dashboard."
    >
      <View className="mb-2">
        <Icon size={iconSize} color={isDark ? "#FFFFFF" : "#000746"} />
      </View>
      <Text
        className={`font-bold uppercase font-open-sans ${labelSizeClass} ${isDark ? "text-white" : "text-[#000000]"}`}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};
