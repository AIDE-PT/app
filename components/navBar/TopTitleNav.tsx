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
}

const TopTitleNav = ({
  title,
  subtitle,
  dark = true,
  href,
}: TopTitleNavProps) => {
  const router = useRouter();

  const handlePress = () => {
    if (href) {
      router.push(href as any);
    } else {
      router.back();
    }
  };

  return (
    <View className="px-5 pt-4 pb-3 bg-white">
      <View className="flex-row items-center mb-2">
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.7}
          className="py-2 mr-2"
        >
          <ArrowIcon variant="LEFT" dark={dark} />
        </TouchableOpacity>
        <Text
          className={`font-safiro text-[28px] ${dark ? "text-[#1A1A2E]" : "text-white"}`}
        >
          {title}
        </Text>
      </View>
      {subtitle && (
        <Text
          className={`font-open-sans text-[14px] ml-8 ${dark ? "text-[#9CA3AF]" : "text-white/60"}`}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
};

export default TopTitleNav;
