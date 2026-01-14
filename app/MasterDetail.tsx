import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LightBackground } from "../components/LightBackground";
import LineChartSlim from "../components/charts/LineChartSlim";
import MainDetails from "../components/details/main";
import ArrowIcon from "../components/svg/ArrowIcon";
import "../global.css";

const screenWidth = Dimensions.get("window").width;

const days = [
  { day: 7, weekday: "Sex", selected: false },
  { day: 8, weekday: "Sáb", selected: false },
  { day: 9, weekday: "Dom", selected: false },
  { day: 10, weekday: "Seg", selected: true },
  { day: 11, weekday: "Ter", selected: false },
  { day: 12, weekday: "Qua", selected: false },
  { day: 13, weekday: "Qui", selected: false },
  { day: 14, weekday: "Sex", selected: false },
];

const heartRateData = [
  72, 85, 78, 92, 88, 75, 82, 90, 85, 78, 72, 80, 88, 75, 82, 79, 85, 90, 72,
  78,
];

export default function MasterDetail() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState(10);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LightBackground>
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="flex-row items-center px-4 pt-2 pb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center"
            >
              <ArrowIcon variant="LEFT" dark size={24} />
            </TouchableOpacity>
            <Text className="flex-1 text-center text-2xl font-safiro text-black mr-10">
              Batimentos Cardíacos
            </Text>
          </View>

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {/* Date Section */}
            <View className="px-4 mb-6">
              <Text className="text-lg font-open-sans text-gray-600 text-center mb-4">
                7 a 14 de Fevereiro
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 8, gap: 10 }}
              >
                {days.map((item) => (
                  <TouchableOpacity
                    key={item.day}
                    onPress={() => setSelectedDay(item.day)}
                    className={`w-14 h-20 rounded-2xl items-center justify-center ${
                      selectedDay === item.day ? "bg-[#748FFC]" : "bg-white"
                    }`}
                    style={{
                      elevation: 3,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                    }}
                  >
                    <Text
                      className={`text-xs font-open-sans mb-1 ${
                        selectedDay === item.day
                          ? "text-white/70"
                          : "text-gray-400"
                      }`}
                    >
                      {item.weekday}
                    </Text>
                    <Text
                      className={`text-xl font-bold font-open-sans ${
                        selectedDay === item.day ? "text-white" : "text-black"
                      }`}
                    >
                      {item.day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Main Stats Card */}
            <View className="px-4 mb-6">
              <MainDetails />
            </View>

            {/* Chart Section */}
            <View className="px-4">
              <View
                className="bg-white rounded-3xl p-5"
                style={{
                  elevation: 3,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                }}
              >
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-lg font-safiro text-black">
                    Histórico
                  </Text>
                  <Text className="text-sm font-open-sans text-gray-400">
                    Últimas 24h
                  </Text>
                </View>

                <LineChartSlim
                  data={heartRateData}
                  width={screenWidth - 72}
                  height={180}
                  lineColor="#748FFC"
                  gradientFrom="#748FFC"
                  gradientTo="#748FFC"
                  gradientFromOpacity={0.3}
                  gradientToOpacity={0}
                  yAxisSuffix=" bpm"
                  segments={4}
                />
              </View>
            </View>

            {/* Additional Info Section */}
            <View className="px-4 mt-6">
              <View className="flex-row gap-3">
                {/* Average Card */}
                <View
                  className="flex-1 bg-white rounded-2xl p-4"
                  style={{
                    elevation: 2,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                  }}
                >
                  <Text className="text-sm font-open-sans text-gray-400 mb-1">
                    Média
                  </Text>
                  <View className="flex-row items-baseline">
                    <Text className="text-3xl font-bold text-black font-safiro">
                      82
                    </Text>
                    <Text className="text-sm text-gray-500 ml-1">bpm</Text>
                  </View>
                </View>

                {/* Resting Card */}
                <View
                  className="flex-1 bg-white rounded-2xl p-4"
                  style={{
                    elevation: 2,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                  }}
                >
                  <Text className="text-sm font-open-sans text-gray-400 mb-1">
                    Em Repouso
                  </Text>
                  <View className="flex-row items-baseline">
                    <Text className="text-3xl font-bold text-black font-safiro">
                      68
                    </Text>
                    <Text className="text-sm text-gray-500 ml-1">bpm</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LightBackground>
    </>
  );
}
