import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

interface MainDetailsProps {
  value?: number;
  unit?: string;
  status?: "normal" | "warning" | "alert";
  max?: number;
  min?: number;
}

const MainDetails = ({
  value = 72,
  unit = "bpm",
  status = "normal",
  max = 167,
  min = 70,
}: MainDetailsProps) => {
  return (
    <View
      className="bg-white rounded-3xl p-5 flex-row justify-between items-center w-full"
      style={{
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      }}
    >
      {/* Left Section */}
      <View className="flex-col justify-center gap-4">
        <View className="flex-row items-baseline">
          <Text className="text-[96px] leading-[96px] font-bold text-black font-safiro tracking-tighter">
            {value}
          </Text>
          <Text className="text-2xl text-black font-medium font-open-sans ml-1">
            {unit}
          </Text>
        </View>

        <View className="bg-[#6BEF8C] self-start px-5 py-2 rounded-full flex-row items-center gap-2">
          <Feather name="smile" size={24} color="#052e16" />
          <Text className="text-[#052e16] text-xl font-open-sans font-medium pb-1">
            {status}
          </Text>
        </View>
      </View>

      {/* Right Section */}
      <View className="flex-col items-end justify-center py-2 ml-4 gap-2">
        {/* Max */}
        <View className="items-end gap-1">
          <View className="flex-row items-baseline">
            <Text className="text-4xl font-bold text-[#FF5252] font-open-sans-semibold">
              {max}
            </Text>
            <Text className="text-lg font-medium text-[#FF5252] ml-1">
              {unit}
            </Text>
          </View>
          <Text className="text-black text-xl font-open-sans">Máximo</Text>
        </View>

        {/* Divider - using a View as a line */}
        <View className="h-[3px] w-16 bg-gray-200 my-4" />

        {/* Min */}
        <View className="items-end gap-1">
          <View className="flex-row items-baseline">
            <Text className="text-4xl font-bold text-[#4ade80] font-open-sans-semibold">
              {min}
            </Text>
            <Text className="text-lg font-medium text-[#4ade80] ml-1">
              {unit}
            </Text>
          </View>
          <Text className="text-black text-xl font-open-sans">Mínimo</Text>
        </View>
      </View>
    </View>
  );
};

export default MainDetails;
