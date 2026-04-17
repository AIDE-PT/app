import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import ChoseCuidado from "../buttons/choseCuidado";
import SOSButton from "../buttons/sosButton";
import NotificationBell from "../svg/NotificationBell";
import SettingsIcon from "../svg/Settings";
import { useTheme } from "@/hooks/useTheme";
import { useUserProfile } from "@/contexts/UserProfileContext";

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
  const ballBg = isDark ? "bg-[#131632]" : "bg-white";
  const styleBall = `items-center w-[50px] h-[50px] rounded-[100px] justify-center ${ballBg}`;

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

  const overlayColor = isDark
    ? "rgba(0, 4, 18, 0.55)"
    : "rgba(219, 237, 248, 1)";

  return (
    <View
      className={`flex-row z-50 px-4 py-5 ${profileType === "cuidado" ? "items-center justify-between" : "items-start justify-between"} ${className}`}
      style={backgroundStyle}
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
            style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
            className={styleBall}
            onPress={onNotificationPress}
            accessibilityRole="button"
            accessibilityLabel="Abrir notificações"
            accessibilityHint="Mostra os alertas e notificações."
          >
            <NotificationBell color={iconColor} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
            className={styleBall}
            onPress={onSettingsPress}
            accessibilityRole="button"
            accessibilityLabel="Abrir definições"
            accessibilityHint="Abre as definições da aplicação."
          >
            <SettingsIcon color={iconColor} />
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View className="flex-1 mr-4">
            <ChoseCuidado
              cuidados={cuidados}
              selectedCuidado={selectedCuidado}
              onSelect={onSelectCuidado}
            />
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
              className={styleBall}
              onPress={onNotificationPress}
              accessibilityRole="button"
              accessibilityLabel="Abrir notificações"
              accessibilityHint="Mostra os alertas e notificações."
            >
              <NotificationBell color={iconColor} />
            </TouchableOpacity>

            <TouchableOpacity
              style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
              className={styleBall}
              onPress={onSettingsPress}
              accessibilityRole="button"
              accessibilityLabel="Abrir definições"
              accessibilityHint="Abre as definições da aplicação."
            >
              <SettingsIcon color={iconColor} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

export default TopBar;
