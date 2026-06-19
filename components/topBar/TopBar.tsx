import { useUserProfile } from "@/contexts/UserProfileContext";
import { useTheme } from "@/hooks/useTheme";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import ChoseCuidado from "../buttons/choseCuidado";
import SOSButton from "../buttons/sosButton";
import {
  getSurfaceStyle,
  surfaceRadius,
  surfaceSpacing,
} from "../surface/surfaceStyles";
import NotificationBell from "../svg/NotificationBell";
import SettingsIcon from "../svg/Settings";

interface Cuidado {
  id: string;
  name: string;
}

interface TopBarProps {
  cuidados: Cuidado[];
  selectedCuidado?: Cuidado;
  onSelectCuidado: (cuidado: Cuidado) => void;
  onNotificationPress?: () => void;
  onSettingsPress?: () => void;
  className?: string;
  showBackground?: boolean;
}

const TopBar = ({
  cuidados,
  selectedCuidado,
  onSelectCuidado,
  onNotificationPress,
  onSettingsPress,
  className,
  showBackground = false,
}: TopBarProps) => {
  const { isDark } = useTheme();
  const { profileType } = useUserProfile();

  const iconColor = isDark ? "white" : "#000000";
  const topBarLayoutStyle = [
    styles.container,
    profileType === "cuidado" ? styles.centered : styles.started,
  ];
  const actionSurface = getSurfaceStyle("elevated", isDark, {
    borderRadius: surfaceRadius.lg,
  });

  const backgroundSurface = showBackground
    ? getSurfaceStyle("elevated", isDark, {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: surfaceRadius.lg,
        borderBottomRightRadius: surfaceRadius.lg,
        overflow: "visible" as const,
      })
    : {};

  const topBarLayerStyle = {
    overflow: "visible" as const,
    zIndex: 60,
    ...(Platform.OS === "android" && !showBackground ? { elevation: 60 } : {}),
  };

  return (
    <View
      className={`z-50 ${className}`}
      style={[...topBarLayoutStyle, backgroundSurface, topBarLayerStyle]}
    >
      {profileType === "cuidado" ? (
        <>
          <SOSButton />

          <TouchableOpacity
            style={[styles.actionButton, actionSurface]}
            onPress={onNotificationPress}
            accessibilityRole="button"
            accessibilityLabel="Abrir notificações"
            accessibilityHint="Mostra os alertas e notificações."
          >
            <NotificationBell color={iconColor} size={21} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, actionSurface]}
            onPress={onSettingsPress}
            accessibilityRole="button"
            accessibilityLabel="Abrir definições"
            accessibilityHint="Abre as definições da aplicação."
          >
            <SettingsIcon color={iconColor} size={21} />
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View className="flex-1" style={styles.selectorLayer}>
            <ChoseCuidado
              cuidados={cuidados}
              selectedCuidado={selectedCuidado}
              onSelect={onSelectCuidado}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, actionSurface]}
              onPress={onNotificationPress}
              accessibilityRole="button"
              accessibilityLabel="Abrir notificações"
              accessibilityHint="Mostra os alertas e notificações."
            >
              <NotificationBell color={iconColor} size={21} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, actionSurface]}
              onPress={onSettingsPress}
              accessibilityRole="button"
              accessibilityLabel="Abrir definições"
              accessibilityHint="Abre as definições da aplicação."
            >
              <SettingsIcon color={iconColor} size={21} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

export default TopBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: surfaceSpacing.md,
    paddingVertical: surfaceSpacing.md,
  },
  centered: {
    alignItems: "center",
  },
  started: {
    alignItems: "flex-start",
  },
  actionButton: {
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  actions: {
    flexDirection: "row",
    gap: surfaceSpacing.sm,
  },
  selectorLayer: {
    marginRight: surfaceSpacing.md,
    overflow: "visible",
    zIndex: 2000,
    elevation: 2000,
  },
});
