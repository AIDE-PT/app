import LightBackground from "@/components/DotBackground";
import BackButton from "@/components/buttons/backButton";
import { useUserProfile } from "@/contexts/UserProfileContext";
import useHealthConnectStatus from "@/hooks/useHealthConnectStatus";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DispositivosPage() {
  const { isDark, colors } = useTheme();
  const { profileType } = useUserProfile();
  const { status: healthConnectStatus, isLoading } = useHealthConnectStatus(
    profileType === "cuidado",
  );
  const isConnected = Boolean(healthConnectStatus?.permissionsGranted);

  useEffect(() => {
    if (profileType === "aider") {
      router.replace("/testDashboard");
    }
  }, [profileType]);

  const statusColor = isConnected
    ? colors.semantic.success
    : isDark
      ? "#C9D0FF"
      : "#5061FF";

  return (
    <LightBackground>
      <View className="flex-1 px-4 pt-10">
        <SafeAreaView className="flex-1">
          <View className="mb-4">
            <BackButton label="Gerir Dispositivos" dark={isDark} />
          </View>

          <View className="mb-8">
            <Text
              className={`mb-8 font-open-sans text-[18px] leading-6 ${
                isDark ? "text-white/60" : "text-[#00072099]"
              }`}
            >
              Ligue o Health Connect para aceder as metricas de saude
              disponiveis no dispositivo.
            </Text>

            <TouchableOpacity
              onPress={() => router.push("/health-connect")}
              accessibilityRole="button"
              accessibilityLabel={
                isConnected
                  ? "Health Connect ligado"
                  : "Ligar ao Health Connect"
              }
              accessibilityHint="Abre a pagina de permissoes do Health Connect."
              activeOpacity={0.8}
              className={`rounded-[24px] border-2 p-5 ${
                isDark ? "bg-aide-dark-card" : "bg-white"
              }`}
              style={{
                borderColor: isConnected
                  ? colors.semantic.success
                  : "transparent",
                boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
              }}
            >
              <View className="flex-row items-center">
                <View
                  className="mr-4 h-14 w-14 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: isDark
                      ? "rgba(80, 97, 255, 0.18)"
                      : "rgba(80, 97, 255, 0.1)",
                  }}
                >
                  <Ionicons
                    name="heart-circle-outline"
                    size={32}
                    color={statusColor}
                  />
                </View>

                <View className="flex-1">
                  <Text
                    className={`text-xl font-bold ${
                      isDark ? "text-white" : "text-black"
                    }`}
                  >
                    Health Connect
                  </Text>
                  <Text
                    className={`mt-1 text-sm leading-5 ${
                      isDark ? "text-white/65" : "text-slate-700"
                    }`}
                  >
                    {isLoading
                      ? "A verificar a ligacao."
                      : isConnected
                        ? "Ligacao ativa para passos, frequencia cardiaca e outros dados permitidos."
                        : "Toque para pedir permissoes e ligar a fonte de dados."}
                  </Text>
                </View>

                {isLoading ? (
                  <ActivityIndicator color={statusColor} />
                ) : (
                  <Ionicons
                    name={
                      isConnected
                        ? "checkmark-circle"
                        : "chevron-forward-circle-outline"
                    }
                    size={28}
                    color={statusColor}
                  />
                )}
              </View>

              <View
                className={`mt-5 self-start rounded-full px-4 py-2 ${
                  isConnected
                    ? isDark
                      ? "bg-emerald-500/15"
                      : "bg-emerald-100"
                    : isDark
                      ? "bg-white/10"
                      : "bg-slate-100"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isConnected
                      ? isDark
                        ? "text-emerald-300"
                        : "text-emerald-700"
                      : isDark
                        ? "text-white/80"
                        : "text-slate-700"
                  }`}
                >
                  {isConnected ? "Ligado" : "Por ligar"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </LightBackground>
  );
}
