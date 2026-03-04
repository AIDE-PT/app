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

interface AddWidgetModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddWidgetModal = ({ visible, onClose }: AddWidgetModalProps) => {
  return (
    <BottomModal visible={visible} onClose={onClose}>
      <View className="pb-8 px-2">
        {/* Fitbit Section */}
        <View className="mb-6">
          <Text className="text-lg font-bold mb-3 font-safiro text-black">
            Fitbit
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <WidgetAdd
              label="BPM"
              Icon={BpmIcon}
              onPress={() => console.log("Add BPM")}
            />
            <WidgetAdd
              label="TEMP"
              Icon={TempIcon}
              onPress={() => console.log("Add TEMP")}
            />
            <WidgetAdd
              label="GLICOSE"
              Icon={GlicoseIcon}
              onPress={() => console.log("Add GLICOSE")}
            />
          </View>
        </View>

        {/* Health Connect Section */}
        <View className="mb-6">
          <Text className="text-lg font-bold mb-3 font-safiro text-black">
            Health Connect
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <WidgetAdd
              label="PASSOS"
              Icon={PassosIcon}
              onPress={() => console.log("Add PASSOS")}
            />
            <WidgetAdd
              label="SONO"
              Icon={SonoIcon}
              onPress={() => console.log("Add SONO")}
            />
            <WidgetAdd
              label="O2"
              Icon={O2Icon}
              onPress={() => console.log("Add O2")}
            />
          </View>
        </View>

        {/* Garmin Section */}
        <View className="mb-6">
          <Text className="text-lg font-bold mb-3 font-safiro text-black">
            Garmin
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <WidgetAdd
              label="PRESSÃO"
              Icon={PressaoIcon}
              onPress={() => console.log("Add PRESSAO")}
            />
            <WidgetAdd
              label="CAL"
              Icon={CalIcon}
              onPress={() => console.log("Add CAL")}
            />
            <WidgetAdd
              label="STRESS"
              Icon={StressIcon}
              onPress={() => console.log("Add STRESS")}
            />
          </View>
        </View>
      </View>
    </BottomModal>
  );
};
