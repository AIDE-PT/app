import React from "react";
import { Text, View } from "react-native";
import { WidgetAdd } from "../buttons/widgetAdd";
import {
  BpmIcon,
  CalIcon,
  GlicoseIcon,
  O2Icon,
  PassosIcon,
  PressaoIcon,
  SonoIcon,
  StressIcon,
  TempIcon,
} from "../svg/HealthIcons";
import BottomModal from "./BottomModal";
import { useTheme } from "@/hooks/useTheme";

interface AddWidgetModalProps {
  visible: boolean;
  onClose: () => void;
  onAddWidget: (widgetId: string) => void;
}

export const AddWidgetModal = ({
  visible,
  onClose,
  onAddWidget,
}: AddWidgetModalProps) => {
  const { isDark } = useTheme();

  const handleAdd = (widgetId: string) => {
    onAddWidget(widgetId);
    onClose();
  };

  return (
    <BottomModal visible={visible} onClose={onClose}>
      <View className="pb-8 px-2">
        {/* Fitbit Section */}
        <View className="mb-6">
          <Text
            className={`text-lg font-bold mb-3 font-safiro ${isDark ? "text-white" : "text-black"}`}
          >
            Fitbit
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <WidgetAdd
              label="BPM"
              Icon={BpmIcon}
              onPress={() => handleAdd("heart")}
            />
            <WidgetAdd
              label="TEMP"
              Icon={TempIcon}
              onPress={() => handleAdd("temp")}
            />
            <WidgetAdd
              label="GLICOSE"
              Icon={GlicoseIcon}
              onPress={() => handleAdd("glycemia")}
            />
          </View>
        </View>

        {/* Health Connect Section */}
        <View className="mb-6">
          <Text
            className={`text-lg font-bold mb-3 font-safiro ${isDark ? "text-white" : "text-black"}`}
          >
            Health Connect
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <WidgetAdd
              label="PASSOS"
              Icon={PassosIcon}
              onPress={() => handleAdd("steps")}
            />
            <WidgetAdd
              label="SONO"
              Icon={SonoIcon}
              onPress={() => handleAdd("sleep")}
            />
            <WidgetAdd
              label="O2"
              Icon={O2Icon}
              onPress={() => handleAdd("o2")}
            />
          </View>
        </View>

        {/* Garmin Section */}
        <View className="mb-6">
          <Text
            className={`text-lg font-bold mb-3 font-safiro ${isDark ? "text-white" : "text-black"}`}
          >
            Garmin
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <WidgetAdd
              label="PRESSÃO"
              Icon={PressaoIcon}
              onPress={() => handleAdd("blood Pressure")}
            />
            <WidgetAdd
              label="CAL"
              Icon={CalIcon}
              onPress={() => handleAdd("cal")}
            />
            <WidgetAdd
              label="STRESS"
              Icon={StressIcon}
              onPress={() => handleAdd("stress")}
            />
          </View>
        </View>
      </View>
    </BottomModal>
  );
};
