import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { BlurView } from "expo-blur";
import ChoseCuidado from "../buttons/choseCuidado";
import SOSButton from "../buttons/SOSButton";
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

  const backgroundStyle = showBackground ? {
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingTop: 58,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden' as const,
  } : {};

  const overlayColor = isDark ? "rgba(0, 4, 18, 0.55)" : "rgba(219, 237, 248, 0.45)";

  return (
    <View
      className={`flex-row z-50 px-4 py-2 ${profileType === "cuidado" ? "items-center justify-between" : "items-start justify-between"} ${className}`}
      style={backgroundStyle}
    >
      {showBackground && (
        <>
          <BlurView
            intensity={60}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: overlayColor }]} />
        </>
      )}
      {profileType === "cuidado" ? (
        <>
          <SOSButton />

          <TouchableOpacity
            style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
            className={styleBall}
            onPress={onNotificationPress}
          >
            <NotificationBell color={iconColor} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
            className={styleBall}
            onPress={onSettingsPress}
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
            >
              <NotificationBell color={iconColor} />
            </TouchableOpacity>

            <TouchableOpacity
              style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
              className={styleBall}
              onPress={onSettingsPress}
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
