import React, { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AddWidgetModal } from "../modals/addWidgetModal";
import AddIcon from "../svg/AdicionarIcon";
import CalendarIcon from "../svg/HistoricoDiarioIcon";
import HomeIcon from "../svg/HomeNovoIcon";
import ProfileIcon from "../svg/PerfilIcon";
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
        <LinearGradient
          colors={dark ? ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)'] : ['#FFFFFF', '#D1D5DB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-[100px] p-[1px]"
          style={{ boxShadow: "0 2px 12px 0 rgba(0,0,0,0.08)" }}
        >
          <View
            className={`flex-row items-center p-2 gap-4 rounded-[100px] ${dark ? "bg-black/50" : "bg-[#DBEDF8]/90"}`}
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
        </LinearGradient>
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
