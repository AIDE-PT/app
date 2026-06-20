import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { AddWidgetModal } from "../modals/addWidgetModal";
import {
  getSurfaceStyle,
  surfaceRadius,
  surfaceSpacing,
} from "../surface/surfaceStyles";
import AddIcon from "../svg/AdicionarIcon";
import CalendarIcon from "../svg/HistoricoDiarioIcon";
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

  // Colors for dark mode
  const iconColor = dark ? "white" : "#191915";
  const navIconSize = 20;
  const navButtonSurface = getSurfaceStyle("elevated", dark, {
    borderRadius: surfaceRadius.lg,
  });
  const navPillSurface = getSurfaceStyle("base", dark, {
    borderRadius: surfaceRadius.lg,
    overflow: "hidden",
  });

  return (
    <>
      <View className="w-200" />
      <View style={styles.navLayer}>
        <View style={[styles.pill, navPillSurface]}>
          <BlurView
            intensity={60}
            tint={dark ? "dark" : "light"}
            style={StyleSheet.absoluteFillObject}
          />
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: navPillSurface.backgroundColor,
              },
            ]}
          />
          <TouchableOpacity
            onPress={
              notEditable && !disableAddAction
                ? () => setModalVisible(true)
                : () => {}
            }
            disabled={disableAddAction}
            style={[
              styles.navButton,
              disableAddAction
                ? [navButtonSurface, { opacity: 0.45 }]
                : highlightAddButton
                  ? getSurfaceStyle("highlight", dark, {
                      borderRadius: surfaceRadius.lg,
                      borderWidth: 2,
                    })
                  : navButtonSurface,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Adicionar"
            accessibilityHint="Abre a lista de widgets disponíveis."
            accessibilityState={{ disabled: disableAddAction }}
          >
            <AddIcon color={iconColor} size={navIconSize} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/historicoDiario")}
            disabled={disableNavigation}
            style={[
              styles.navButton,
              disableNavigation
                ? [navButtonSurface, { opacity: 0.45 }]
                : navButtonSurface,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Historico"
            accessibilityHint="Abre o histórico diário."
            accessibilityState={{ disabled: disableNavigation }}
          >
            <CalendarIcon color={iconColor} size={navIconSize} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/notas" as never)}
            style={[styles.navButton, navButtonSurface]}
            accessibilityRole="button"
            accessibilityLabel="Notas"
            accessibilityHint="Abre as notas colaborativas."
          >
            <Feather name="file-text" size={22} color={iconColor} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/report" as never)}
            disabled={disableNavigation}
            style={[
              styles.navButton,
              disableNavigation
                ? [navButtonSurface, { opacity: 0.45 }]
                : navButtonSurface,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Relatório"
            accessibilityHint="Abre o gerador de relatórios."
            accessibilityState={{ disabled: disableNavigation }}
          >
            <Feather name="clipboard" size={22} color={iconColor} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/definicoes")}
            disabled={disableNavigation}
            style={[
              styles.navButton,
              disableNavigation
                ? [navButtonSurface, { opacity: 0.45 }]
                : navButtonSurface,
            ]}
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
  navLayer: {
    alignItems: "center",
    bottom: surfaceSpacing.lg,
    position: "absolute",
    width: "100%",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    padding: surfaceSpacing.xs,
    gap: surfaceSpacing.sm,
    borderRadius: surfaceRadius.lg,
    overflow: "hidden",
  },
  navButton: {
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    width: 48,
  },
});
