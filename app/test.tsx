import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TestScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <Text className="text-3xl font-bold text-gray-900 mb-6">
          Native Wind Test
        </Text>

        {/* Color Palette */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Colors
          </Text>
          <View className="flex-row gap-2">
            <View className="h-16 w-16 bg-blue-500 rounded-lg" />
            <View className="h-16 w-16 bg-red-500 rounded-lg" />
            <View className="h-16 w-16 bg-green-500 rounded-lg" />
          </View>
        </View>

        {/* Button */}
        <TouchableOpacity className="bg-blue-600 rounded-lg py-3 px-4 mb-4">
          <Text className="text-white text-center font-semibold">
            Test Button
          </Text>
        </TouchableOpacity>

        {/* Card */}
        <View className="bg-gray-100 rounded-lg p-4 mb-4">
          <Text className="text-gray-900 font-semibold mb-2">
            Card Component
          </Text>
          <Text className="text-gray-600">
            This is a test card with Tailwind styling
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
