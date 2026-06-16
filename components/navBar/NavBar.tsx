import { useTheme } from "@/hooks/useTheme";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { AddWidgetModal } from "../modals/addWidgetModal";
import AddIcon from "../svg/AdicionarIcon";
import CalendarIcon from "../svg/HistoricoDiarioIcon";
import HomeIcon from "../svg/HomeNovoIcon";
import ProfileIcon from "../svg/PerfilIcon";

interface navBarProps {
  dark?: boolean;
  notEditable?: boolean;
  onAddWidget?: (widgetId: string) => void;
  disableNavigation?: boolean;
  highlightAddButton?: boolean;
  disableAddAction?: boolean;
}
const Navbar = ({
  dark: darkProp,
  notEditable = false,
  onAddWidget,
  disableNavigation = false,
  highlightAddButton = false,
  disableAddAction = false,
}: navBarProps) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  const { isDark } = useTheme();

  // Use prop if provided, otherwise use global theme
  const dark = darkProp !== undefined ? darkProp : isDark;

  const styleBall =
    "items-center w-[48px] h-[48px] rounded-[100px] justify-center";

  // Colors for dark mode
  const iconColor = dark ? "white" : "#191915";
  const buttonBg = dark ? "bg-[#131632]" : "bg-white";
  const navIconSize = 20;

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
            onPress={
              notEditable && !disableAddAction
                ? () => setModalVisible(true)
                : () => {}
            }
            disabled={disableAddAction}
            style={
              disableAddAction
                ? { opacity: 0.45 }
                : highlightAddButton
                  ? {
                      borderWidth: 2,
                      borderColor: "#5061FF",
                    }
                  : undefined
            }
            accessibilityRole="button"
            accessibilityLabel="Adicionar"
            accessibilityHint="Abre a lista de widgets disponíveis."
            accessibilityState={{ disabled: disableAddAction }}
          >
            <AddIcon color={iconColor} size={navIconSize} />
          </TouchableOpacity>

          <TouchableOpacity
            className={`${styleBall} ${buttonBg}`}
            onPress={() => router.push("/historicoDiario")}
            disabled={disableNavigation}
            style={disableNavigation ? { opacity: 0.45 } : undefined}
            accessibilityRole="button"
            accessibilityLabel="Historico"
            accessibilityHint="Abre o histórico diário."
            accessibilityState={{ disabled: disableNavigation }}
          >
            <CalendarIcon color={iconColor} size={navIconSize} />
          </TouchableOpacity>

          <TouchableOpacity
            className={`${styleBall} ${buttonBg}`}
            onPress={() => router.push("/testDashboard")}
            disabled={disableNavigation}
            style={disableNavigation ? { opacity: 0.45 } : undefined}
            accessibilityRole="button"
            accessibilityLabel="Inicio"
            accessibilityHint="Abre o dashboard principal."
            accessibilityState={{ disabled: disableNavigation }}
          >
            <HomeIcon color={iconColor} size={navIconSize} />
          </TouchableOpacity>

          <TouchableOpacity
            className={`${styleBall} ${buttonBg}`}
            onPress={() => router.push("/definicoes")}
            disabled={disableNavigation}
            style={disableNavigation ? { opacity: 0.45 } : undefined}
            accessibilityRole="button"
            accessibilityLabel="Perfil"
            accessibilityHint="Abre o perfil e definições."
            accessibilityState={{ disabled: disableNavigation }}
          >
            <ProfileIcon color={iconColor} size={navIconSize} />
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
    padding: 7,
    gap: 14,
    borderRadius: 100,
    overflow: "hidden",
  },
});
