import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { clsx } from "clsx";
import { LineChart } from "react-native-gifted-charts";
import "../global.css";

export default function TestScreen() {
  const [color, setColor] = useState("blue");
  const data = [{ value: 50 }, { value: 80 }, { value: 90 }, { value: 70 }];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <Text className="mb-6 text-3xl font-bold text-gray-900">
          Native Wind Test
        </Text>

        {/* Color Palette */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-gray-800">
            Colors
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={() => setColor("blue")}>
              <View className="w-16 h-16 bg-blue-500 rounded-lg" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setColor("red")}>
              <View className="w-16 h-16 bg-red-500 rounded-lg" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setColor("green")}>
              <View className="w-16 h-16 bg-green-500 rounded-lg" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Button */}
        <TouchableOpacity className="px-4 py-3 mb-4 bg-blue-600 rounded-lg">
          <Text className="font-semibold text-center text-white">
            Test Button
          </Text>
        </TouchableOpacity>

        {/* Card */}
        <View
          className={clsx("rounded-lg p-4 mb-4", {
            "bg-blue-100": color === "blue",
            "bg-red-100": color === "red",
            "bg-green-100": color === "green",
          })}
        >
          <Text className="mb-2 font-semibold text-gray-900">
            Card Component
          </Text>
          <Text className="text-gray-600">
            This is a test card with Tailwind styling
          </Text>
        </View>

        <LineChart data={data} areaChart />
      </ScrollView>
    </SafeAreaView>
  );
}
