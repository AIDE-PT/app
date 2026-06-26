import {
  getHealthConnectStatus,
  type HealthConnectStatus,
} from "@/src/services/healthConnect";
import { useCallback, useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

export function useHealthConnectStatus(enabled = true) {
  const [status, setStatus] = useState<HealthConnectStatus | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    if (!enabled) {
      setStatus(null);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const nextStatus = await getHealthConnectStatus();
      setStatus(nextStatus);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel verificar o estado do Health Connect.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!enabled) return;

    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          void loadStatus();
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [enabled, loadStatus]);

  return {
    status,
    isLoading,
    errorMessage,
    refresh: loadStatus,
  };
}

export default useHealthConnectStatus;
