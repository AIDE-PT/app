import { useUserProfile } from "@/contexts/UserProfileContext";
import { useTheme } from "@/hooks/useTheme";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CuidadoModal from "../modals/CuidadoModal";
import SOSButton from "../buttons/sosButton";
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
  const ballBg = isDark ? "bg-[#131632]" : "bg-white";
  const styleBall = `items-center w-[46px] h-[46px] rounded-[100px] justify-center ${ballBg}`;

  const backgroundStyle = showBackground
    ? {
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        overflow: "visible" as const,
      }
    : {};

  const topBarLayerStyle = {
    overflow: "visible" as const,
    zIndex: 60,
    elevation: 60,
  };

  const overlayColor = isDark
    ? "rgba(0, 4, 18, 0.55)"
    : "rgba(219, 237, 248, 1)";

  return (
    <View
      className={`flex-row z-50 px-4 py-5 ${profileType === "cuidado" ? "items-center justify-between" : "items-start justify-between"} ${className}`}
      style={[backgroundStyle, topBarLayerStyle]}
    >
      {showBackground && (
        <>
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: overlayColor,
                borderBottomLeftRadius: 40,
                borderBottomRightRadius: 40,
              },
            ]}
          />
        </>
      )}
      {profileType === "cuidado" ? (
        <>
          <SOSButton />

          <TouchableOpacity
            style={{ boxShadow: "0 1px 4px 0 rgba(0, 0, 0, 0.08)" }}
            className={styleBall}
            onPress={onNotificationPress}
            accessibilityRole="button"
            accessibilityLabel="Abrir notificações"
            accessibilityHint="Mostra os alertas e notificações."
          >
            <NotificationBell color={iconColor} size={21} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ boxShadow: "0 1px 4px 0 rgba(0, 0, 0, 0.08)" }}
            className={styleBall}
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

          <View className="flex-row gap-3">
            <TouchableOpacity
              style={{ boxShadow: "0 1px 4px 0 rgba(0, 0, 0, 0.08)" }}
              className={styleBall}
              onPress={onNotificationPress}
              accessibilityRole="button"
              accessibilityLabel="Abrir notificações"
              accessibilityHint="Mostra os alertas e notificações."
            >
              <NotificationBell color={iconColor} size={21} />
            </TouchableOpacity>

            <TouchableOpacity
              style={{ boxShadow: "0 1px 4px 0 rgba(0, 0, 0, 0.08)" }}
              className={styleBall}
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
