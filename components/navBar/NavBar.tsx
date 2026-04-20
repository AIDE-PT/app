import React, { useState } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
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
  onAddWidget?: (widgetId: string) => void;
}
const Navbar = ({
  dark: darkProp,
  notEditable = false,
  onAddWidget,
}: navBarProps) => {
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
        <View style={styles.pill}>
          <BlurView
            intensity={60}
            tint={dark ? "dark" : "light"}
            style={StyleSheet.absoluteFillObject}
          />
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: dark
                  ? "rgba(0,4,18,0.55)"
                  : "rgba(219,237,248,0.75)",
              },
            ]}
          />
          <TouchableOpacity
            className={`${styleBall} ${buttonBg}`}
            onPress={notEditable ? () => setModalVisible(true) : () => {}}
            accessibilityRole="button"
            accessibilityLabel="Adicionar"
            accessibilityHint="Abre a lista de widgets disponíveis."
          >
            <AddIcon color={iconColor} />
          </TouchableOpacity>

          <TouchableOpacity
            className={`${styleBall} ${buttonBg}`}
            onPress={() => router.push("/historicoDiario")}
            accessibilityRole="button"
            accessibilityLabel="Historico"
            accessibilityHint="Abre o histórico diário."
          >
            <CalendarIcon color={iconColor} />
          </TouchableOpacity>

          <TouchableOpacity
            className={`${styleBall} ${buttonBg}`}
            onPress={() => router.push("/testDashboard")}
            accessibilityRole="button"
            accessibilityLabel="Inicio"
            accessibilityHint="Abre o dashboard principal."
          >
            <HomeIcon color={iconColor} />
          </TouchableOpacity>

          <TouchableOpacity
            className={`${styleBall} ${buttonBg}`}
            onPress={() => router.push("/definicoes")}
            accessibilityRole="button"
            accessibilityLabel="Perfil"
            accessibilityHint="Abre o perfil e definições."
          >
            <ProfileIcon color={iconColor} />
          </TouchableOpacity>
        </View>
      </View>
      {notEditable && (
        <AddWidgetModal
          visible={isModalVisible}
          onClose={() => setModalVisible(false)}
          onAddWidget={(widgetId) => onAddWidget?.(widgetId)}
        />
      )}
    </>
  );
};

export default Navbar;

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    gap: 16,
    borderRadius: 100,
    overflow: "hidden",
  },
});
