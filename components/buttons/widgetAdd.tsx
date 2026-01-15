import { useFonts } from "expo-font";
import { Text, TouchableOpacity, View } from "react-native";
import { SvgProps } from "react-native-svg";

interface WidgetAddProps {
  label: string;
  Icon: React.FC<SvgProps & { size?: number; color?: string }>;
  onPress: () => void;
}

export const WidgetAdd = ({ label, Icon, onPress }: WidgetAddProps) => {
  const [fontsLoaded] = useFonts({
    "Safiro-Medium": require("@/assets/fonts/safiro/safiro-medium-webfont.ttf"),
    "OpenSans-Regular": require("@/assets/fonts/open-sans/OpenSans-Regular.ttf"),
    "OpenSans-SemiBold": require("@/assets/fonts/open-sans/OpenSans-SemiBold.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-[20px] w-[100px] h-[100px] font-safiro items-center justify-center m-1 shadow-sm"
      activeOpacity={0.7}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <View className="mb-2">
        <Icon size={32} color="#000746" />
      </View>
      <Text className="text-[#000000] font-bold text-[18px] uppercase font-open-sans">
        {label}
      </Text>
    </TouchableOpacity>
  );
};
