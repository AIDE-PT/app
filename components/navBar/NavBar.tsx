import React, { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { AddWidgetModal } from "../modals/addWidgetModal";
import AddIcon from "../svg/AddIcon";
import CalendarIcon from "../svg/CalendarIcon";
import HomeIcon from "../svg/HomeIcon";
import ProfileIcon from "../svg/ProfileIcon";
import { useRouter } from "expo-router";

interface navBarProps {
  dark?: boolean;
  notEditable?: boolean;
}
const Navbar = ({ dark, notEditable = false }: navBarProps) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  const styleBall =
    "items-center bg-white  w-[52px] h-[52px] rounded-[100px] justify-center";

  return (
    <>
      <View className="w-200" />
      <View className="absolute bottom-6 w-full items-center">
        <View
          style={{ boxShadow: "0 4px 24.1px 0 rgba(0, 0, 0, 0.25)" }}
          className={`flex-row items-center p-2 gap-4 rounded-[100px] border border-white/10 ${dark ? "bg-black/25" : "bg-[#DBEDF8]/90"}`}
        >
          <TouchableOpacity
            className={styleBall}
            onPress={notEditable ? () => setModalVisible(true) : () => {}}
          >
            <AddIcon />
          </TouchableOpacity>

          <TouchableOpacity
            className={styleBall}
            onPress={() => router.push("./historicoDiario")}
          >
            <CalendarIcon />
          </TouchableOpacity>

          <TouchableOpacity
            className={styleBall}
            onPress={() => router.push("./testDashboard")}
          >
            <HomeIcon />
          </TouchableOpacity>

          <TouchableOpacity className={styleBall}>
            <ProfileIcon />
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
