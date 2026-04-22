import LightBackground from "@/components/DotBackground";
import { useTheme } from "@/hooks/useTheme";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import axios from "axios";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "../components/buttons/backButton";

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
  isDark,
}: {
  title: string;
  endpoint: string;
  unit: string;
  color: string;
  isBP?: boolean;
  isDark: boolean;
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
      <View
        className={`items-center justify-center h-32 p-4 mb-4 rounded-[20px] ${isDark ? "bg-aide-dark-card" : "bg-white"}`}
        style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
      >
        <ActivityIndicator
          color={color}
          accessibilityLabel={`A carregar ${title}`}
        />
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
    <View
      className={`p-4 mb-4 rounded-[20px] ${isDark ? "bg-aide-dark-card border border-white/10" : "bg-white border border-gray-100"}`}
      style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text
          className={`text-base font-medium ${isDark ? "text-white/70" : "text-gray-500"}`}
        >
          {title}
        </Text>
        <View
          className={`w-3 h-3 rounded-full`}
          style={{ backgroundColor: color }}
        />
      </View>

      <View className="flex-row items-end mb-2">
        <Text
          className={`mr-2 text-3xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}
        >
          {displayValue}
        </Text>
        <Text
          className={`mb-1 font-medium ${isDark ? "text-white/70" : "text-gray-500"}`}
        >
          {unit}
        </Text>
      </View>

      <View
        className={`p-2 rounded-lg ${isDark ? "bg-white/5" : "bg-gray-50"}`}
      >
        <Text
          className={`text-xs ${isDark ? "text-white/60" : "text-gray-500"}`}
        >
          {displayStats}
        </Text>
      </View>
    </View>
  );
};

const HealthDataContent = () => {
  const { isDark, colors } = useTheme();

  return (
    <LightBackground>
      <View className="flex-1 bg-transparent px-4 pt-10">
        <SafeAreaView className="flex-1">
          <View className="mb-4">
            <BackButton
              label="Gerir Dados"
              dark={isDark}
              onPress={() => router.push("/definicoes")}
            />
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <View className="w-full">
              <MetricCard
                title="Heart Rate"
                endpoint="bpm"
                unit="BPM"
                color={colors.semantic.danger}
                isDark={isDark}
              />
              <MetricCard
                title="Blood Pressure"
                endpoint="bloodPressure"
                unit="mmHg"
                color={colors.semantic.danger}
                isBP
                isDark={isDark}
              />
              <MetricCard
                title="Glycemia"
                endpoint="glycemia"
                unit="mg/dL"
                color={colors.semantic.warning}
                isDark={isDark}
              />
              <MetricCard
                title="Oxygen Saturation"
                endpoint="o2"
                unit="%"
                color={colors.semantic.success}
                isDark={isDark}
              />
              <MetricCard
                title="Temperature"
                endpoint="temperature"
                unit="°C"
                color={colors.semantic.warning}
                isDark={isDark}
              />
              <MetricCard
                title="Stress Level"
                endpoint="stress"
                unit="pts"
                color={colors.semantic.warning}
                isDark={isDark}
              />
              <MetricCard
                title="Sleep Duration"
                endpoint="sleep"
                unit="hrs"
                color={colors.semantic.success}
                isDark={isDark}
              />
            </View>

            <Text
              className={`pb-10 mt-4 text-center ${isDark ? "text-white/40" : "text-gray-400"}`}
            >
              Data updates automatically every 10s
            </Text>
          </ScrollView>
        </SafeAreaView>
      </View>
    </LightBackground>
  );
};

export default function HealthDataPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <HealthDataContent />
    </QueryClientProvider>
  );
}
