import React, { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { AddWidgetModal } from "../modals/addWidgetModal";
import AddIcon from "../svg/AddIcon";
import CalendarIcon from "../svg/CalendarIcon";
import HomeIcon from "../svg/HomeIcon";
import ProfileIcon from "../svg/ProfileIcon";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";

interface navBarProps {
  dark?: boolean;
  notEditable?: boolean;
}
const Navbar = ({ dark: darkProp, notEditable = false }: navBarProps) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  const { isDark } = useTheme();
  
  // Use prop if provided, otherwise use global theme
  const dark = darkProp !== undefined ? darkProp : isDark;

  const styleBall =
    "items-center w-[52px] h-[52px] rounded-[100px] justify-center";

  // Colors for dark mode
  const iconColor = dark ? "white" : "#191915";
  const buttonBg = dark ? "bg-[#131632]" : "bg-white";

  return (
    <>
      <View className="w-200" />
      <View className="absolute bottom-6 w-full items-center">
        <View
          style={{ boxShadow: "0 4px 24.1px 0 rgba(0, 0, 0, 0.25)" }}
          className={`flex-row items-center p-2 gap-4 rounded-[100px] border border-white/10 ${dark ? "bg-black/50" : "bg-[#DBEDF8]/90"}`}
        >
          <TouchableOpacity
            className={`${styleBall} ${buttonBg}`}
            onPress={notEditable ? () => setModalVisible(true) : () => {}}
          >
            <AddIcon color={iconColor} />
          </TouchableOpacity>

          <TouchableOpacity
            className={`${styleBall} ${buttonBg}`}
            onPress={() => router.push("/historicoDiario")}
          >
            <CalendarIcon color={iconColor} />
          </TouchableOpacity>

          <TouchableOpacity
            className={`${styleBall} ${buttonBg}`}
            onPress={() => router.push("/testDashboard")}
          >
            <HomeIcon color={iconColor} />
          </TouchableOpacity>

          <TouchableOpacity
            className={`${styleBall} ${buttonBg}`}
            onPress={() => router.push("/definicoes")}
          >
            <ProfileIcon color={iconColor} />
          </TouchableOpacity>
        </View>
      </View>
      {notEditable && (
        <AddWidgetModal
          visible={isModalVisible}
          onClose={() => setModalVisible(false)}
        />
      )}
    </>
  );
};

export default Navbar;
