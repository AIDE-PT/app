import { CalendarButton } from "@/components/buttons/calendarButton";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BackButton from "../components/buttons/backButton";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DashboardMetricWidget from "../components/widgets/DashboardMetricWidget";
import WidgetGrid from "../components/widgets/WidgetGrid";
import LightBackground from "@/components/DotBackground";
import { useTheme } from "@/hooks/useTheme";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

const HistoricoDiario = () => {
  const router = useRouter();
  const [date, setDatetPass] = useState<string | Date>("");
  const { isDark } = useTheme();
  return (
    <QueryClientProvider client={queryClient}>
      <LightBackground>
        <View className="flex-1 px-4 pt-10">
          <SafeAreaView className="flex-1">
          <View className="mb-4">
            <BackButton
              label="Histórico Diário"
              dark
              onPress={() => router.push("/testDashboard")}
            />
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <View className="flex-row -mx-4">
              <CalendarButton
                label="Dia"
                onDateChange={(d: Date) => setDatetPass(d)}
              />
              <CalendarButton
                label="Período"
                onDateChange={(d: Date) => setDatetPass(d)}
              />
              <Text>{date as string}</Text>
            </View>

            <View className="mt-4 -mx-4">
              <WidgetGrid>
                <TouchableOpacity onPress={() => router.push("/MasterDetail")}>
                  <DashboardMetricWidget
                    type="heartRate"
                    endpoint="bpm"
                    variant="2-3"
                  />
                </TouchableOpacity>
                <DashboardMetricWidget
                  type="bloodPressure"
                  endpoint="bloodPressure"
                  variant="1-2"
                />
                <DashboardMetricWidget
                  type="temp"
                  endpoint="temperature"
                  variant="1-3"
                />
                <DashboardMetricWidget
                  type="steps"
                  endpoint="steps"
                  variant="2-3"
                />
              </WidgetGrid>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </LightBackground>
  </QueryClientProvider>
  );
};

export default HistoricoDiario;
