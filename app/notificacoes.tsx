import LightBackground from "@/components/DotBackground";
import { useTheme } from "@/hooks/useTheme";
import { getSupabaseClient } from "@/utils/supabase/client";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "../components/buttons/backButton";

type NotificationSeverity = "high" | "medium" | "low";

interface AppNotification {
  id: string;
  type: string;
  title: string;
  content: string;
  severity: NotificationSeverity;
  timestamp: string;
}

const getNotificationSeverity = (
  type?: string | null,
): NotificationSeverity => {
  if (type === "sos" || type === "alert") return "high";
  if (type === "warning") return "medium";
  return "low";
};

const fetchNotifications = async (): Promise<AppNotification[]> => {
  const { data, error } = await getSupabaseClient()
    .from("notifications")
    .select("id,type,title,content,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((notification) => ({
    id: String(notification.id),
    type: String(notification.type ?? "info"),
    title: String(notification.title ?? "Notificacao"),
    content: String(notification.content ?? ""),
    severity: getNotificationSeverity(notification.type),
    timestamp: String(notification.created_at ?? new Date().toISOString()),
  }));
};

const clearAllNotifications = async (): Promise<void> => {
  const {
    data: { user },
    error: userError,
  } = await getSupabaseClient().auth.getUser();

  if (userError) throw new Error(userError.message);
  if (!user?.id) return;

  const { error } = await getSupabaseClient()
    .from("notifications")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }
};

const NotificationItem = ({
  title,
  message,
  timestamp,
  severity,
  isDark,
  semantic,
}: {
  title: string;
  message: string;
  timestamp: string;
  severity: NotificationSeverity;
  isDark: boolean;
  semantic: { success: string; warning: string; danger: string };
}) => {
  const getSeverityColors = () => {
    switch (severity) {
      case "high":
        return {
          bg: "bg-black/5",
          borderColor: semantic.danger,
          iconColor: semantic.danger,
          icon: "alert-circle",
        };
      case "medium":
        return {
          bg: "bg-black/5",
          borderColor: semantic.warning,
          iconColor: semantic.warning,
          icon: "warning",
        };
      case "low":
        return {
          bg: "bg-black/5",
          borderColor: semantic.success,
          iconColor: semantic.success,
          icon: "information-circle",
        };
    }
  };

  const colors = getSeverityColors();
  const dateObj = new Date(timestamp);
  const timeString = dateObj.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateString = dateObj.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const accessibilityLabel = `${title}. ${message}. ${dateString}, ${timeString}.`;

  return (
    <View
      className={`mb-4 overflow-hidden rounded-xl border-l-4 ${
        isDark
          ? "bg-aide-dark-card border-white/10"
          : "bg-white border-gray-100"
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
      <View
        className="flex-row p-4 items-start"
        importantForAccessibility="no-hide-descendants"
      >
        <View
          className={`mr-3 mt-1 rounded-full p-2 ${colors.bg}`}
          accessible={false}
        >
          <Ionicons
            name={colors.icon as any}
            size={24}
            color={colors.iconColor}
          />
        </View>
        <View className="flex-1">
          <Text
            className={`font-bold text-base mb-1 ${isDark ? "text-white" : "text-gray-900"}`}
            accessible={false}
          >
            {title}
          </Text>
          <Text
            className={`text-base mb-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}
            accessible={false}
          >
            {message}
          </Text>
          <Text
            className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
            accessible={false}
          >
            {dateString} as {timeString}
          </Text>
        </View>
      </View>
    </View>
  );
};

const NotificationsContent = () => {
  const { isDark, colors } = useTheme();
  const [showClearModal, setShowClearModal] = useState(false);

  const {
    data: notifications,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 10000,
  });

  const clearNotificationsMutation = useMutation({
    mutationFn: clearAllNotifications,
    onSuccess: () => {
      refetch();
    },
  });

  const handleClearNotifications = () => {
    setShowClearModal(false);
    clearNotificationsMutation.mutate();
  };

  return (
    <LightBackground>
      <View className="flex-1 pt-10 bg-transparent">
        <SafeAreaView className="flex-1">
          <View className="px-4 mb-4 flex-row items-center justify-between">
            <BackButton
              label="Notificacoes"
              dark={isDark}
              onPress={() => router.back()}
            />
            {notifications && notifications.length > 0 && (
              <Pressable
                onPress={() => setShowClearModal(true)}
                className={`px-4 py-2 rounded-lg ${isDark ? "bg-red-500/20" : "bg-red-100"}`}
              >
                <Text
                  className={`font-medium ${isDark ? "text-red-400" : "text-red-600"}`}
                >
                  Limpar
                </Text>
              </Pressable>
            )}
          </View>

          <ScrollView
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
              <RefreshControl
                refreshing={isFetching || isLoading}
                onRefresh={refetch}
              />
            }
          >
            {isLoading && (
              <ActivityIndicator
                size="large"
                color={isDark ? "#ffffff" : "#0000ff"}
                accessibilityLabel="A carregar notificacoes"
              />
            )}

            {!isLoading && (!notifications || notifications.length === 0) && (
              <View className="items-center justify-center py-20">
                <Ionicons
                  name="notifications-off-outline"
                  size={64}
                  color={isDark ? "#4B5563" : "#D1D5DB"}
                  accessible={false}
                />
                <Text
                  className={`mt-4 text-center text-lg ${isDark ? "text-gray-500" : "text-gray-400"}`}
                >
                  Nenhuma notificacao registada.
                </Text>
                <Text
                  className={`mt-2 text-center text-sm ${isDark ? "text-gray-600" : "text-gray-500"}`}
                >
                  Atualizacoes de dados e alertas SOS vao aparecer aqui.
                </Text>
              </View>
            )}

            {notifications?.map((notification) => (
              <NotificationItem
                key={notification.id}
                title={notification.title}
                message={notification.content}
                severity={notification.severity}
                timestamp={notification.timestamp}
                isDark={isDark}
                semantic={colors.semantic}
              />
            ))}

            <Text
              className={`mt-8 text-center text-xs ${isDark ? "text-white/30" : "text-gray-400"}`}
            >
              As notificacoes sao guardadas ate serem limpas.
            </Text>
          </ScrollView>
        </SafeAreaView>

        <Modal
          visible={showClearModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowClearModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-6">
            <View
              className={`w-full max-w-sm rounded-2xl p-6 ${isDark ? "bg-aide-dark-card border border-white/10" : "bg-white border border-gray-100"}`}
            >
              <Text
                className={`text-xl font-bold mb-4 text-center ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Limpar Notificacoes
              </Text>
              <Text
                className={`text-base mb-6 text-center ${isDark ? "text-gray-300" : "text-gray-600"}`}
              >
                Tem a certeza que deseja limpar todas as notificacoes? Esta acao
                nao pode ser desfeita.
              </Text>
              <View className="flex-row justify-between gap-3">
                <Pressable
                  onPress={() => setShowClearModal(false)}
                  className={`flex-1 py-3 rounded-xl ${isDark ? "bg-white/10" : "bg-gray-200"}`}
                >
                  <Text
                    className={`text-center font-medium ${isDark ? "text-white" : "text-gray-700"}`}
                  >
                    Cancelar
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleClearNotifications}
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
  return <NotificationsContent />;
}
