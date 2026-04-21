import { useTheme } from "@/hooks/useTheme";
import React from "react";
import { Text, View, useWindowDimensions } from "react-native";
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
  const { width } = useWindowDimensions();

  const horizontalPadding = 32;
  const maxContentWidth = 560;
  const cardGap = 10;
  const columnCount = width < 390 ? 2 : 3;
  const contentWidth = Math.max(
    Math.min(width - horizontalPadding, maxContentWidth),
    280,
  );
  const cardWidth = Math.floor(
    (contentWidth - cardGap * (columnCount - 1)) / columnCount,
  );

  const handleAdd = (widgetId: string) => {
    onAddWidget(widgetId);
    onClose();
  };

  return (
    <BottomModal visible={visible} onClose={onClose}>
      <View className="pb-8" style={{ width: contentWidth, alignSelf: "center" }}>
        {/* Fitbit Section */}
        <View className="mb-7">
          <Text
            className={`text-lg font-bold mb-3 font-safiro ${isDark ? "text-white" : "text-black"}`}
          >
            Fitbit
          </Text>
          <View
            className="flex-row flex-wrap"
            style={{ rowGap: cardGap, columnGap: cardGap }}
          >
            <WidgetAdd
              label="BPM"
              Icon={BpmIcon}
              onPress={() => handleAdd("heart")}
              width={cardWidth}
            />
            <WidgetAdd
              label="TEMP"
              Icon={TempIcon}
              onPress={() => handleAdd("temp")}
              width={cardWidth}
            />
            <WidgetAdd
              label="GLICOSE"
              Icon={GlicoseIcon}
              onPress={() => handleAdd("glycemia")}
              width={cardWidth}
            />
          </View>
        </View>

        {/* Health Connect Section */}
        <View className="mb-7">
          <Text
            className={`text-lg font-bold mb-3 font-safiro ${isDark ? "text-white" : "text-black"}`}
          >
            Health Connect
          </Text>
          <View
            className="flex-row flex-wrap"
            style={{ rowGap: cardGap, columnGap: cardGap }}
          >
            <WidgetAdd
              label="PASSOS"
              Icon={PassosIcon}
              onPress={() => handleAdd("steps")}
              width={cardWidth}
            />
            <WidgetAdd
              label="SONO"
              Icon={SonoIcon}
              onPress={() => handleAdd("sleep")}
              width={cardWidth}
            />
            <WidgetAdd
              label="O2"
              Icon={O2Icon}
              onPress={() => handleAdd("o2")}
              width={cardWidth}
            />
          </View>
        </View>

        {/* Garmin Section */}
        <View className="mb-7">
          <Text
            className={`text-lg font-bold mb-3 font-safiro ${isDark ? "text-white" : "text-black"}`}
          >
            Garmin
          </Text>
          <View
            className="flex-row flex-wrap"
            style={{ rowGap: cardGap, columnGap: cardGap }}
          >
            <WidgetAdd
              label="PRESSÃO"
              Icon={PressaoIcon}
              onPress={() => handleAdd("blood Pressure")}
              width={cardWidth}
            />
            <WidgetAdd
              label="CAL"
              Icon={CalIcon}
              onPress={() => handleAdd("glycemia")}
              width={cardWidth}
            />
            <WidgetAdd
              label="STRESS"
              Icon={StressIcon}
              onPress={() => handleAdd("stress")}
              width={cardWidth}
            />
          </View>
        </View>
      </View>
    </BottomModal>
  );
};
