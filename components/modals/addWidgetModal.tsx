import { useTheme } from "@/hooks/useTheme";
import React from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { WidgetAdd } from "../buttons/widgetAdd";
import {
  BpmIcon,
  CalIcon,
  O2Icon,
  PassosIcon,
  PressaoIcon,
  SonoIcon,
  TempIcon,
} from "../svg/HealthIcons";
import { DASHBOARD_CONFIG } from "../widgets/WidgetWrapper";
import BottomModal from "./BottomModal";

interface AddWidgetModalProps {
  visible: boolean;
  onClose: () => void;
  onAddWidget: (widgetId: string) => void;
}

const HEALTH_CONNECT_SUPPORTED_ENDPOINTS = new Set([
  "bpm",
  "steps",
  "bloodPressure",
  "temperature",
  "sleep",
  "o2",
  "cal",
]);

const WIDGET_META_BY_ID: Record<
  string,
  {
    label: string;
    Icon: React.FC<
      import("react-native-svg").SvgProps & { size?: number; color?: string }
    >;
  }
> = {
  heart: { label: "BPM", Icon: BpmIcon },
  temp: { label: "TEMP", Icon: TempIcon },
  bloodPressure: { label: "PRESSÃO", Icon: PressaoIcon },
  steps: { label: "PASSOS", Icon: PassosIcon },
  sleep: { label: "SONO", Icon: SonoIcon },
  o2: { label: "O2", Icon: O2Icon },
  cal: { label: "CAL", Icon: CalIcon },
};

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

  const providerWidgets = DASHBOARD_CONFIG.filter((widget) =>
    HEALTH_CONNECT_SUPPORTED_ENDPOINTS.has(widget.endpoint),
  ).filter((widget) => WIDGET_META_BY_ID[widget.id]);

  const handleAdd = (widgetId: string) => {
    onAddWidget(widgetId);
    onClose();
  };

  return (
    <BottomModal visible={visible} onClose={onClose}>
      <View
        className="pb-8"
        style={{ width: contentWidth, alignSelf: "center" }}
      >
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
            {providerWidgets.map((widget) => {
              const meta = WIDGET_META_BY_ID[widget.id];
              return (
                <WidgetAdd
                  key={widget.id}
                  label={meta.label}
                  Icon={meta.Icon}
                  onPress={() => handleAdd(widget.id)}
                  width={cardWidth}
                />
              );
            })}
          </View>
        </View>
      </View>
    </BottomModal>
  );
};
