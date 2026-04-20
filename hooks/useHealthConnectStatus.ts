import {
  getHealthConnectStatus,
  type HealthConnectStatus,
} from "@/src/services/healthConnect";
import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

export function useHealthConnectStatus() {
  const [status, setStatus] = useState<HealthConnectStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStatus = async () => {
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
  };

  useEffect(() => {
    void loadStatus();
  }, []);

  useEffect(() => {
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
  }, []);

  return {
    status,
    isLoading,
    errorMessage,
    refresh: loadStatus,
  };
}

export default useHealthConnectStatus;
