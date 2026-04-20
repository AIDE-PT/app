import BackButton from "@/components/buttons/backButton";
import { Button } from "@/components/buttons/button";
import LightBackground from "@/components/DotBackground";
import { useTheme } from "@/hooks/useTheme";
import {
  getHealthConnectStatus,
  HEALTH_CONNECT_SDK_AVAILABLE,
  requestHealthConnectPermissions,
  type HealthConnectError,
  type HealthConnectStatus,
} from "@/src/services/healthConnect";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  SafeAreaView,
  ScrollView,
  Text,
  View,
  type AppStateStatus,
} from "react-native";

type RequestState = "idle" | "pending" | "success" | "denied" | "error";

const HealthConnectScreen = () => {
  const { isDark, colors } = useTheme();
  const [status, setStatus] = useState<HealthConnectStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [isAwaitingSettingsReturn, setIsAwaitingSettingsReturn] =
    useState(false);

  const loadStatus = async (options?: { preserveFeedback?: boolean }) => {
    console.log("[HealthConnectScreen] loadStatus:start", options);
    setIsLoadingStatus(true);
    try {
      const nextStatus = await getHealthConnectStatus();
      console.log("[HealthConnectScreen] loadStatus:success", nextStatus);
      setStatus(nextStatus);
      if (!options?.preserveFeedback) {
        setFeedbackMessage("");
      }
    } catch (error) {
      console.log("[HealthConnectScreen] loadStatus:error", error);
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel verificar o estado do Health Connect.";
      setFeedbackMessage(message);
      setRequestState("error");
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    void loadStatus();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        console.log("[HealthConnectScreen] AppState changed", nextAppState, {
          isAwaitingSettingsReturn,
        });
        if (nextAppState === "active" && isAwaitingSettingsReturn) {
          setIsAwaitingSettingsReturn(false);
          setIsRequesting(false);
          setRequestState("pending");
          setFeedbackMessage(
            "Regressou do Health Connect. Confirme que as permissoes foram ativadas e toque novamente para continuar, se necessario.",
          );
          void loadStatus({ preserveFeedback: true });
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [isAwaitingSettingsReturn]);

  const handleRequestPermissions = async () => {
    console.log("[HealthConnectScreen] handleRequestPermissions:start");
    setIsRequesting(true);
    setRequestState("idle");
    setFeedbackMessage("");

    try {
      const permissionResult = await requestHealthConnectPermissions();
      console.log(
        "[HealthConnectScreen] handleRequestPermissions:result",
        permissionResult,
      );
      if (permissionResult.granted) {
        setRequestState("success");
        setFeedbackMessage(
          "Permissoes concedidas para ler passos, frequencia cardiaca, tensao arterial, oxigenio, temperatura, sono, calorias e stress.",
        );
      } else if (permissionResult.opened) {
        setIsAwaitingSettingsReturn(true);
        setRequestState("pending");
        setFeedbackMessage(
          "O Health Connect foi aberto. Ative as permissoes e volte para esta app para revalidar o estado.",
        );
      } else {
        setRequestState("denied");
        setFeedbackMessage(
          "O acesso foi recusado. Pode voltar a tentar quando estiver pronto.",
        );
      }
      await loadStatus({ preserveFeedback: true });
    } catch (error) {
      console.log(
        "[HealthConnectScreen] handleRequestPermissions:error",
        error,
      );
      const nativeError = error as HealthConnectError;
      if (nativeError?.code === "PERMISSION_DENIED") {
        setRequestState("denied");
        setFeedbackMessage(
          "O acesso foi recusado. Pode ativar as permissoes mais tarde no Health Connect.",
        );
      } else {
        setRequestState("error");
        setFeedbackMessage(
          nativeError?.message ??
            "Nao foi possivel pedir permissoes ao Health Connect.",
        );
      }
    } finally {
      console.log("[HealthConnectScreen] handleRequestPermissions:finally");
      setIsRequesting(false);
    }
  };

  const isAvailable = status?.sdkStatus === HEALTH_CONNECT_SDK_AVAILABLE;
  const hasGrantedPermissions = Boolean(status?.permissionsGranted);
  const statusTone =
    requestState === "success"
      ? colors.semantic.success
      : requestState === "denied" || requestState === "pending"
        ? colors.semantic.warning
        : colors.semantic.danger;

  return (
    <LightBackground>
      <View className="flex-1 px-4 pt-10">
        <SafeAreaView className="flex-1">
          <View className="mb-4">
            <BackButton label="Health Connect" dark={isDark} />
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <View
              className={`rounded-[32px] p-6 mb-4 ${isDark ? "bg-aide-dark-card" : "bg-white"}`}
              style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
            >
              <View className="flex-row items-center mb-4">
                <View
                  className="w-14 h-14 rounded-full items-center justify-center mr-4"
                  style={{
                    backgroundColor: isDark
                      ? "rgba(80, 97, 255, 0.18)"
                      : "rgba(80, 97, 255, 0.1)",
                  }}
                >
                  <Ionicons
                    name="heart-circle-outline"
                    size={28}
                    color={colors.semantic.danger}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-2xl font-safiro ${isDark ? "text-white" : "text-black"}`}
                  >
                    Ligar ao Health Connect
                  </Text>
                  <Text
                    className={`mt-1 text-sm font-open-sans ${isDark ? "text-white/70" : "text-black/60"}`}
                  >
                    Gerir acesso a passos e frequencia cardiaca diretamente no
                    seu dispositivo Android.
                  </Text>
                </View>
              </View>

              {isLoadingStatus ? (
                <View className="py-6 items-center">
                  <ActivityIndicator color={colors.semantic.danger} />
                </View>
              ) : (
                <View className="gap-3">
                  {hasGrantedPermissions && (
                    <View
                      className={`rounded-[24px] p-4 flex-row items-center ${isDark ? "bg-emerald-500/12" : "bg-emerald-50"}`}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={isDark ? "#86efac" : "#15803d"}
                      />
                      <View className="ml-3 flex-1">
                        <Text
                          className={`text-sm font-open-sans font-bold ${isDark ? "text-emerald-300" : "text-emerald-800"}`}
                        >
                          Health Connect ligado com sucesso
                        </Text>
                        <Text
                          className={`mt-1 text-xs font-open-sans ${isDark ? "text-emerald-200/80" : "text-emerald-700"}`}
                        >
                          As permissoes necessarias ja estao ativas para este
                          fluxo.
                        </Text>
                      </View>
                    </View>
                  )}

                  <View
                    className={`rounded-[24px] p-4 ${isDark ? "bg-white/5" : "bg-[#F6F8FF]"}`}
                  >
                    <Text
                      className={`text-xs uppercase font-open-sans font-bold ${isDark ? "text-white/50" : "text-black/40"}`}
                    >
                      Estado da aplicacao
                    </Text>
                    <Text
                      className={`mt-2 text-base font-open-sans ${isDark ? "text-white" : "text-black"}`}
                    >
                      {status?.installed
                        ? "Health Connect instalado"
                        : "Health Connect nao instalado"}
                    </Text>
                    <Text
                      className={`mt-1 text-sm font-open-sans ${isDark ? "text-white/70" : "text-black/60"}`}
                    >
                      {status?.needsUpdate
                        ? "E necessario atualizar a app Health Connect antes de continuar."
                        : hasGrantedPermissions
                          ? "As permissoes necessarias ja estao ativas neste dispositivo."
                          : isAvailable
                            ? "O dispositivo esta pronto para pedir permissoes."
                            : "O Health Connect nao esta disponivel neste dispositivo neste momento."}
                    </Text>
                  </View>

                  <View
                    className={`rounded-[24px] p-4 ${isDark ? "bg-white/5" : "bg-[#F6F8FF]"}`}
                  >
                    <Text
                      className={`text-xs uppercase font-open-sans font-bold ${isDark ? "text-white/50" : "text-black/40"}`}
                    >
                      Permissoes pedidas
                    </Text>
                    <Text
                      className={`mt-2 text-sm font-open-sans ${isDark ? "text-white" : "text-black"}`}
                    >
                      Leitura de passos, frequencia cardiaca, tensao arterial,
                      oxigenio, temperatura, sono, calorias e stress.
                    </Text>
                    <Text
                      className={`mt-2 text-xs font-open-sans ${isDark ? "text-white/60" : "text-black/50"}`}
                    >
                      {`Permissoes encontradas: ${status?.grantedPermissionsCount ?? 0}/8`}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View className="items-center mb-5">
              <Button
                variant="primary"
                label={
                  hasGrantedPermissions
                    ? "Permissoes ativas"
                    : isAvailable
                      ? "Pedir permissoes"
                      : "Verificar disponibilidade"
                }
                onPress={
                  hasGrantedPermissions
                    ? () => void loadStatus({ preserveFeedback: true })
                    : isAvailable
                      ? handleRequestPermissions
                      : () => void loadStatus()
                }
                disabled={isLoadingStatus}
                loading={isRequesting}
              />
            </View>

            {(feedbackMessage || requestState !== "idle") && (
              <View
                className={`rounded-[28px] p-5 ${isDark ? "bg-aide-dark-card" : "bg-white"}`}
                style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
              >
                <View className="flex-row items-center mb-2">
                  <Ionicons
                    name={
                      requestState === "success"
                        ? "checkmark-circle"
                        : requestState === "denied" ||
                            requestState === "pending"
                          ? "alert-circle"
                          : "close-circle"
                    }
                    size={20}
                    color={statusTone}
                  />
                  <Text
                    className={`ml-2 text-base font-open-sans font-bold ${isDark ? "text-white" : "text-black"}`}
                  >
                    {requestState === "success"
                      ? "Ligacao concluida"
                      : requestState === "pending"
                        ? "A aguardar confirmacao"
                        : requestState === "denied"
                          ? "Permissao recusada"
                          : "Nao foi possivel concluir"}
                  </Text>
                </View>
                <Text
                  className={`text-sm font-open-sans ${isDark ? "text-white/70" : "text-black/60"}`}
                >
                  {feedbackMessage}
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </LightBackground>
  );
};

export default HealthConnectScreen;
