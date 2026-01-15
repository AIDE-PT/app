import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import axios from "axios";
import { Stack } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";

// API Configuration

// Create a client
const queryClient = new QueryClient();
const API_BASE = Platform.select({
  android: "http://10.0.2.2:3000",
  default: "http://localhost:3000",
});

// Types
interface BaseStats {
  min: number;
  max: number;
}

interface BPStats {
  minSystolic: number;
  maxSystolic: number;
  minDiastolic: number;
  maxDiastolic: number;
}

interface MetricValue {
  id: string;
  value: number;
  timestamp: string;
}

interface BPValue {
  id: string;
  systolic: number;
  diastolic: number;
  timestamp: string;
}

// Fetchers
const fetchLatestMetric = async (endpoint: string) => {
  // Fetch all data (capped at 50 by server) and sort client-side to ensure we get the latest
  const response = await axios.get(`${API_BASE}/${endpoint}`);
  const data = response.data;

  if (Array.isArray(data) && data.length > 0) {
    // Sort descending by timestamp (newest first)
    data.sort(
      (a: any, b: any) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    return data[0];
  }

  return null;
};

const fetchStats = async (endpoint: string) => {
  const { data } = await axios.get(`${API_BASE}/${endpoint}`);
  return data;
};

// Components
const MetricCard = ({
  title,
  endpoint,
  unit,
  color,
  isBP = false,
}: {
  title: string;
  endpoint: string;
  unit: string;
  color: string;
  isBP?: boolean;
}) => {
  const { data: latestData, isLoading: isLoadingLatest } = useQuery({
    queryKey: [endpoint, "latest"],
    queryFn: () => fetchLatestMetric(endpoint),
    refetchInterval: 5000, // Refresh every 5s
  });

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: [endpoint, "stats"],
    queryFn: () => fetchStats(`${endpoint}Stats`),
    refetchInterval: 10000,
  });

  if (isLoadingLatest || isLoadingStats) {
    return (
      <View className="items-center justify-center h-32 p-4 mb-4 bg-white shadow-sm rounded-2xl">
        <ActivityIndicator color={color} />
      </View>
    );
  }

  const latest = latestData;
  const stats = statsData;

  // Format Display Value
  let displayValue = "--";
  if (latest) {
    if (isBP) {
      displayValue = `${(latest as BPValue).systolic}/${(latest as BPValue).diastolic}`;
    } else {
      displayValue = `${(latest as MetricValue).value}`;
    }
  }

  // Format Stats
  let displayStats = "Loading stats...";
  if (stats) {
    if (isBP) {
      const s = stats as BPStats;
      displayStats = `Min: ${s.minSystolic}/${s.minDiastolic}  Max: ${s.maxSystolic}/${s.maxDiastolic}`;
    } else {
      const s = stats as BaseStats;
      displayStats = `Min: ${s.min}  Max: ${s.max}`;
    }
  }

  return (
    <View className="p-4 mb-4 bg-white border border-gray-100 shadow-sm rounded-2xl">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-base font-medium text-gray-500">{title}</Text>
        <View
          className={`w-3 h-3 rounded-full`}
          style={{ backgroundColor: color }}
        />
      </View>

      <View className="flex-row items-end mb-2">
        <Text className="mr-2 text-3xl font-bold text-gray-800">
          {displayValue}
        </Text>
        <Text className="mb-1 font-medium text-gray-500">{unit}</Text>
      </View>

      <View className="p-2 rounded-lg bg-gray-50">
        <Text className="text-xs text-gray-500">{displayStats}</Text>
      </View>
    </View>
  );
};

const HealthDataContent = () => {
  return (
    <SafeAreaView className="flex-1 bg-[#F1F7FF]">
      <Stack.Screen
        options={{
          title: "Live Health Data",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#F1F7FF" },
        }}
      />

      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text className="mb-6 text-2xl font-bold text-gray-800">
          Real-time Monitor
        </Text>

        <View className="w-full">
          <MetricCard
            title="Heart Rate"
            endpoint="bpm"
            unit="BPM"
            color="#FF5252"
          />
          <MetricCard
            title="Blood Pressure"
            endpoint="bloodPressure"
            unit="mmHg"
            color="#FF4081"
            isBP
          />
          <MetricCard
            title="Glycemia"
            endpoint="glycemia"
            unit="mg/dL"
            color="#7C4DFF"
          />
          <MetricCard
            title="Oxygen Saturation"
            endpoint="o2"
            unit="%"
            color="#00BCD4"
          />
          <MetricCard
            title="Temperature"
            endpoint="temperature"
            unit="°C"
            color="#FF9800"
          />
          <MetricCard
            title="Stress Level"
            endpoint="stress"
            unit="pts"
            color="#607D8B"
          />
          <MetricCard
            title="Sleep Duration"
            endpoint="sleep"
            unit="hrs"
            color="#3F51B5"
          />
        </View>

        <Text className="pb-10 mt-4 text-center text-gray-400">
          Data updates automatically every 10s
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default function HealthDataPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <HealthDataContent />
    </QueryClientProvider>
  );
}
