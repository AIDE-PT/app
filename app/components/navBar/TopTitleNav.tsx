import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import ArrowIcon from "../svg/ArrowIcon";

interface TopTitleNavProps {
  /** Main title text */
  title: string;
  /** Optional subtitle text (e.g., last updated date) */
  subtitle?: string;
  /** Use dark mode styling (default: true for light backgrounds) */
  dark?: boolean;
  /** Specific route to navigate to (if not provided, uses router.back()) */
  href?: string;
  /** Variant: 'default' (white background) or 'transparent' (no background, white text) */
  variant?: "default" | "transparent";
}

const TopTitleNav = ({
  title,
  subtitle,
  dark = true,
  href,
  variant = "default",
}: TopTitleNavProps) => {
  const router = useRouter();

  const handlePress = () => {
    if (href) {
      router.push(href as any);
    } else {
      router.back();
    }
  };

  // Determine background and text colors based on variant
  const isTransparent = variant === "transparent";
  const backgroundColor = isTransparent ? "transparent" : "bg-white";
  const titleColor = isTransparent ? "text-white" : dark ? "text-[#1A1A2E]" : "text-white";
  const subtitleColor = isTransparent ? "text-white/80" : dark ? "text-[#9CA3AF]" : "text-white/60";
  const shadowStyle = isTransparent ? {} : { boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" };

  return (
    <View className={`px-5 pt-4 pb-3 ${backgroundColor}`} style={shadowStyle}>
      <View className="flex-row items-center mb-2">
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.7}
          className="py-2 mr-2"
        >
          <ArrowIcon variant="LEFT" dark={isTransparent ? true : dark} />
        </TouchableOpacity>
        <Text className={`font-safiro text-[28px] ${titleColor}`}>
          {title}
        </Text>
      </View>
      {subtitle && (
        <Text className={`font-open-sans text-[14px] ml-8 ${subtitleColor}`}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

export default TopTitleNav;
