import React from "react";
import { TouchableOpacity, View } from "react-native";
import ChoseCuidado from "../buttons/choseCuidado";
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
}

const styleBall =
  "items-center bg-white  w-[50px] h-[50px] rounded-[100px] justify-center shadow";

const TopBar = ({
  cuidados,
  selectedCuidado,
  onSelectCuidado,
  onNotificationPress,
  onSettingsPress,
  className,
}: TopBarProps) => {
  return (
    <View
      className={`flex-row items-center justify-between px-4 py-2 ${className}`}
    >
      <View className="flex-1 mr-4">
        <ChoseCuidado
          cuidados={cuidados}
          selectedCuidado={selectedCuidado}
          onSelect={onSelectCuidado}
        />
      </View>

      <View className="flex-row gap-3">
        <TouchableOpacity className={styleBall} onPress={onNotificationPress}>
          <NotificationBell />
        </TouchableOpacity>

        <TouchableOpacity className={styleBall} onPress={onSettingsPress}>
          <SettingsIcon />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TopBar;
