import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import axios from "axios";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import BackButton from "../components/buttons/backButton";
import LightBackground from "@/components/DotBackground";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";

// API Configuration
const queryClient = new QueryClient();
const API_BASE = Platform.select({
  android: "http://10.0.2.2:3000",
  default: "http://localhost:3000",
});

// Types
interface Alert {
  id: string;
  type: string;
  message: string;
  severity: "high" | "medium" | "low";
  timestamp: string;
  read: boolean;
}

// Fetchers
const fetchAlerts = async (): Promise<Alert[]> => {
  const response = await axios.get(`${API_BASE}/alerts`);
  const data = response.data;
  if (Array.isArray(data) && data.length > 0) {
    // Sort descending by timestamp (newest first)
    data.sort(
      (a: any, b: any) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return data;
  }
  return [];
};

const clearAllAlerts = async (): Promise<void> => {
  // Get all alerts first
  const response = await axios.get(`${API_BASE}/alerts`);
  const data = response.data;
  
  if (Array.isArray(data)) {
    // Delete each alert one by one
    for (const alert of data) {
      await axios.delete(`${API_BASE}/alerts/${alert.id}`);
    }
  }
};

const NotificationItem = ({
  message,
  timestamp,
  severity,
  isDark,
  semantic,
}: {
  message: string;
  timestamp: string;
  severity: "high" | "medium" | "low";
  isDark: boolean;
  semantic: { success: string; warning: string; danger: string };
}) => {
  const severityLabel =
    severity === "high" ? "Alerta crítico" : severity === "medium" ? "Aviso" : "Informação";

  const getSeverityColors = () => {
    switch (severity) {
      case "high":
        return { 
          bg: "bg-black/5", 
          borderColor: semantic.danger,
          iconColor: semantic.danger,
          icon: "alert-circle" 
        };
      case "medium":
        return { 
          bg: "bg-black/5", 
          borderColor: semantic.warning,
          iconColor: semantic.warning,
          icon: "warning" 
        };
      case "low":
        return { 
          bg: "bg-black/5", 
          borderColor: semantic.success,
          iconColor: semantic.success,
          icon: "information-circle" 
        };
    }
  };

  const colors = getSeverityColors();
  const dateObj = new Date(timestamp);
  const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = dateObj.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const spokenDate = dateObj.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const accessibilityLabel = `${severityLabel}. ${message}. ${spokenDate}, ${timeString}.`;

  return (
    <View
      className={`mb-4 overflow-hidden rounded-xl border-l-4 ${
        isDark ? "bg-aide-dark-card border-white/10" : "bg-white border-gray-100"
      }`}
      accessible
      focusable
      importantForAccessibility="yes"
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      style={{ 
        boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
        borderLeftColor: colors.borderColor,
      }}
    >
      <View className={`flex-row p-4 items-start`} importantForAccessibility="no-hide-descendants">
        <View className={`mr-3 mt-1 rounded-full p-2 ${colors.bg}`} accessible={false}>
          <Ionicons name={colors.icon as any} size={24} color={colors.iconColor} />
        </View>
        <View className="flex-1">
          <Text className={`font-bold text-base mb-1 ${isDark ? "text-white" : "text-gray-900"}`} accessible={false}>
            {severityLabel}
          </Text>
          <Text className={`text-base mb-2 ${isDark ? "text-gray-300" : "text-gray-600"}`} accessible={false}>
            {message}
          </Text>
          <Text className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`} accessible={false}>
            {dateString} at {timeString}
          </Text>
        </View>
      </View>
    </View>
  );
};

const NotificationsContent = () => {
  const { isDark, colors } = useTheme();
  const [showClearModal, setShowClearModal] = useState(false);

  // Fetch alerts from server
  const { data: alerts, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["alerts"],
    queryFn: fetchAlerts,
    refetchInterval: 10000,
  });

  // Mutation to clear alerts
  const clearAlertsMutation = useMutation({
    mutationFn: clearAllAlerts,
    onSuccess: () => {
      refetch();
    },
  });

  const handleClearAlerts = () => {
    setShowClearModal(false);
    clearAlertsMutation.mutate();
  };

  return (
    <LightBackground>
      <View className="flex-1 pt-10 bg-transparent">
        <SafeAreaView className="flex-1">
          <View className="px-4 flex-row items-center justify-between">
            <BackButton
              label="Notificações"
              dark={isDark}
              onPress={() => router.back()}
            />
            {alerts && alerts.length > 0 && (
              <Pressable
                onPress={() => setShowClearModal(true)}
                className={`px-4 py-2 rounded-lg ${isDark ? "bg-red-500/20" : "bg-red-100"}`}
              >
                <Text className={`font-medium ${isDark ? "text-red-400" : "text-red-600"}`}>
                  Limpar
                </Text>
              </Pressable>
            )}
          </View>
          
          <ScrollView
            className="flex-1 px-4 mt-4"
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
              <RefreshControl refreshing={isFetching || isLoading} onRefresh={refetch} />
            }
          >
            
            {isLoading && (
              <ActivityIndicator
                size="large"
                color={isDark ? "#ffffff" : "#0000ff"}
                accessibilityLabel="A carregar notificações"
              />
            )}

            {!isLoading && (!alerts || alerts.length === 0) && (
              <View className="items-center justify-center py-20">
                <Ionicons
                  name="notifications-off-outline"
                  size={64}
                  color={isDark ? "#4B5563" : "#D1D5DB"}
                  accessible={false}
                />
                <Text className={`mt-4 text-center text-lg ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  Nenhum alerta de saúde registado.
                </Text>
                <Text className={`mt-2 text-center text-sm ${isDark ? "text-gray-600" : "text-gray-500"}`}>
                  Os alertas serão mostrados aqui quando forem detetados valores inseguros.
                </Text>
              </View>
            )}

            {alerts && alerts.map((alert) => (
              <NotificationItem
                key={alert.id}
                message={alert.message}
                severity={alert.severity}
                timestamp={alert.timestamp}
                isDark={isDark}
                semantic={colors.semantic}
              />
            ))}

            <Text className={`mt-8 text-center text-xs ${isDark ? "text-white/30" : "text-gray-400"}`}>
              Os alertas são guardados permanentemente e não desaparecem.
            </Text>
          </ScrollView>
        </SafeAreaView>

        {/* Clear Confirmation Modal */}
        <Modal
          visible={showClearModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowClearModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-6">
            <View className={`w-full max-w-sm rounded-2xl p-6 ${isDark ? "bg-aide-dark-card border border-white/10" : "bg-white border border-gray-100"}`}>
              <Text className={`text-xl font-bold mb-4 text-center ${isDark ? "text-white" : "text-gray-900"}`}>
                Limpar Notificações
              </Text>
              <Text className={`text-base mb-6 text-center ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                Tem a certeza que deseja limpar todas as notificações? Esta ação não pode ser desfeita.
              </Text>
              <View className="flex-row justify-between gap-3">
                <Pressable
                  onPress={() => setShowClearModal(false)}
                  className={`flex-1 py-3 rounded-xl ${isDark ? "bg-white/10" : "bg-gray-200"}`}
                >
                  <Text className={`text-center font-medium ${isDark ? "text-white" : "text-gray-700"}`}>
                    Cancelar
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleClearAlerts}
                  className="flex-1 py-3 rounded-xl bg-red-500"
                >
                  <Text className="text-center font-medium text-white">
                    Limpar
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </LightBackground>
  );
};

export default function NotificationsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationsContent />
    </QueryClientProvider>
  );
}
