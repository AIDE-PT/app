import { useUserProfile } from "@/contexts/UserProfileContext";
import { useTheme } from "@/hooks/useTheme";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CuidadoModal from "../modals/CuidadoModal";
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
  const [showModal, setShowModal] = useState(false);

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
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            activeOpacity={0.7}
            className={`flex-1 mr-4 flex-row items-center justify-between rounded-2xl px-4 py-3 ${
              isDark ? "bg-white/10" : "bg-white/70"
            }`}
            style={{ boxShadow: "0 1px 4px 0 rgba(0,0,0,0.08)" }}
          >
            <Text
              className={`font-semibold flex-1 ${isDark ? "text-white" : "text-slate-900"}`}
              numberOfLines={1}
            >
              {selectedCuidado?.name ?? "Selecionar paciente"}
            </Text>
            <Text className={isDark ? "text-white/50" : "text-slate-400"}>
              ▾
            </Text>
          </TouchableOpacity>
          <CuidadoModal
            visible={showModal}
            onClose={() => setShowModal(false)}
            cuidados={cuidados}
            onSelect={(c) => {
              onSelectCuidado(c);
              setShowModal(false);
            }}
          />

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
