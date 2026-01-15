import { CalendarButton } from "@/components/buttons/calendarButton";
import React, { useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import BackButton from "../components/buttons/backButton";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import EditableDashboard from "@/components/dashboard/EditableDashboard";

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
  const [date, setDatetPass] = useState<string | Date>("");
  return (
    <SafeAreaView className="flex-1 bg-[#F5F9FF]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-6 py-8">
          <BackButton label="Histórico Diário" />
        </View>

        <View className="flex-row">
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

        <QueryClientProvider client={queryClient}>
          <EditableDashboard notEditable />
        </QueryClientProvider>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HistoricoDiario;
