import useHealthConnectStatus from "@/hooks/useHealthConnectStatus";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type AppStateStatus,
} from "react-native";
import {
  initialize,
  readRecords,
  type RecordResult,
} from "react-native-health-connect";

type HealthRecordType =
  | "HeartRate"
  | "Steps"
  | "BloodPressure"
  | "BodyTemperature"
  | "OxygenSaturation"
  | "TotalCaloriesBurned";

type AggregatedResult =
  | { average: number; count: number }
  | { total: number; days: number }
  | { systolic: number; diastolic: number; count: number }
  | null;

interface HealthData {
  heartRate: { average: number; count: number } | null;
  steps: { total: number; days: number } | null;
  bloodPressure: { systolic: number; diastolic: number; count: number } | null;
  temperature: { average: number; count: number } | null;
  oxygen: { average: number; count: number } | null;
  calories: { total: number; days: number } | null;
}

interface MetricProps {
  label: string;
  value: any;
  unit?: string;
  subtitle?: string | null;
}

export default function HealthSummary() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HealthData>({
    heartRate: null,
    steps: null,
    bloodPressure: null,
    temperature: null,
    oxygen: null,
    calories: null,
  });
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const { status: healthConnectStatus, isLoading: isLoadingStatus } =
    useHealthConnectStatus();

  const appState = useRef(AppState.currentState);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Inicializar dados quando Health Connect está pronto
  useEffect(() => {
    if (!isLoadingStatus && healthConnectStatus) {
      if (healthConnectStatus.permissionsGranted) {
        void fetchData();
        // Iniciar sincronização automática a cada 30 segundos
        startAutoSync();
      } else {
        setLoading(false);
      }
    }
    return () => {
      stopAutoSync();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingStatus, healthConnectStatus?.permissionsGranted]);

  // Listener para quando app volta ao primeiro plano
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthConnectStatus?.permissionsGranted]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    // Se app voltou do background para foreground
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      console.log("App voltou para primeiro plano, sincronizando dados...");
      // Recarregar dados imediatamente quando app volta ao primeiro plano
      if (healthConnectStatus?.permissionsGranted) {
        fetchData();
      }
    }
    appState.current = nextAppState;
  };

  const startAutoSync = () => {
    // Sincronizar a cada 30 segundos
    syncIntervalRef.current = setInterval(() => {
      if (healthConnectStatus?.permissionsGranted) {
        console.log("Sincronizando dados do Health Connect...");
        void fetchData();
      }
    }, 30000); // 30 segundos
  };

  const stopAutoSync = () => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  };

  const fetchData = async () => {
    try {
      const isInitialized = await initialize();
      if (!isInitialized) {
        console.log("Health Connect not available");
        setLoading(false);
        return;
      }

      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - 30); // últimos 30 dias

      const results = await Promise.all([
        getAggregatedData("HeartRate", start, now),
        getAggregatedData("Steps", start, now),
        getAggregatedData("BloodPressure", start, now),
        getAggregatedData("BodyTemperature", start, now),
        getAggregatedData("OxygenSaturation", start, now),
        getAggregatedData("TotalCaloriesBurned", start, now),
      ]);

      setData({
        heartRate: results[0] as { average: number; count: number } | null,
        steps: results[1] as { total: number; days: number } | null,
        bloodPressure: results[2] as {
          systolic: number;
          diastolic: number;
          count: number;
        } | null,
        temperature: results[3] as { average: number; count: number } | null,
        oxygen: results[4] as { average: number; count: number } | null,
        calories: results[5] as { total: number; days: number } | null,
      });

      // Registrar hora da última sincronização bem-sucedida
      setLastSyncTime(new Date());
      console.log(
        "Dados sincronizados com sucesso:",
        new Date().toLocaleTimeString(),
      );
    } catch (e: any) {
      console.error("Health Connect data fetch error:", e);
      // Don't crash the app, just show empty data
      setData({
        heartRate: null,
        steps: null,
        bloodPressure: null,
        temperature: null,
        oxygen: null,
        calories: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const getAggregatedData = async (
    type: HealthRecordType,
    startTime: Date,
    endTime: Date,
  ): Promise<AggregatedResult> => {
    try {
      const res = await readRecords(type as any, {
        timeRangeFilter: {
          operator: "between",
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
        ascendingOrder: true,
      });

      if (!res.records || res.records.length === 0) {
        return null;
      }

      const records = res.records;

      switch (type) {
        case "HeartRate":
          // Calcular média dos batimentos cardíacos
          const allHeartRates = records
            .flatMap((record) => {
              const hr = record as RecordResult<"HeartRate">;
              return (
                hr.samples?.map((sample: any) => sample.beatsPerMinute) || []
              );
            })
            .filter((rate) => rate != null);
          const avgHeartRate =
            allHeartRates.length > 0
              ? allHeartRates.reduce((sum, rate) => sum + rate, 0) /
                allHeartRates.length
              : null;
          return avgHeartRate
            ? { average: Math.round(avgHeartRate), count: allHeartRates.length }
            : null;

        case "Steps":
          // Somar todos os passos
          const totalSteps = records.reduce(
            (sum, record) =>
              sum + ((record as RecordResult<"Steps">).count || 0),
            0,
          );
          return totalSteps > 0
            ? { total: totalSteps, days: records.length }
            : null;

        case "BloodPressure":
          // Calcular média da pressão arterial
          const systolicValues = records
            .map((r) => {
              const bp = r as RecordResult<"BloodPressure">;
              // Tentar acessar como número direto ou propriedade aninhada
              return (bp as any).systolic || null;
            })
            .filter((v) => v != null) as number[];
          const diastolicValues = records
            .map((r) => {
              const bp = r as RecordResult<"BloodPressure">;
              return (bp as any).diastolic || null;
            })
            .filter((v) => v != null) as number[];
          const avgSystolic =
            systolicValues.length > 0
              ? systolicValues.reduce((sum, val) => sum + val, 0) /
                systolicValues.length
              : null;
          const avgDiastolic =
            diastolicValues.length > 0
              ? diastolicValues.reduce((sum, val) => sum + val, 0) /
                diastolicValues.length
              : null;
          return avgSystolic && avgDiastolic
            ? {
                systolic: Math.round(avgSystolic),
                diastolic: Math.round(avgDiastolic),
                count: records.length,
              }
            : null;

        case "BodyTemperature":
          // Calcular média da temperatura
          const temperatures = records
            .map((r) => {
              const temp = r as RecordResult<"BodyTemperature">;
              // Tentar acessar como número direto ou propriedade aninhada
              return (temp as any).temperature || null;
            })
            .filter((t) => t != null) as number[];
          const avgTemperature =
            temperatures.length > 0
              ? temperatures.reduce((sum, temp) => sum + temp, 0) /
                temperatures.length
              : null;
          return avgTemperature
            ? {
                average: Math.round(avgTemperature * 10) / 10,
                count: temperatures.length,
              }
            : null;

        case "OxygenSaturation":
          // Calcular média da saturação de oxigênio
          const oxygenValues = records
            .map((r) => (r as RecordResult<"OxygenSaturation">).percentage)
            .filter((p) => p != null);
          const avgOxygen =
            oxygenValues.length > 0
              ? oxygenValues.reduce((sum, perc) => sum + perc, 0) /
                oxygenValues.length
              : null;
          return avgOxygen
            ? {
                average: Math.round(avgOxygen * 10) / 10,
                count: oxygenValues.length,
              }
            : null;

        case "TotalCaloriesBurned":
          // Somar todas as calorias queimadas
          const totalCalories = records.reduce(
            (sum, record) =>
              sum +
              ((record as RecordResult<"TotalCaloriesBurned">).energy
                ?.inKilocalories || 0),
            0,
          );
          return totalCalories > 0
            ? { total: Math.round(totalCalories), days: records.length }
            : null;

        default:
          return null; // Fallback para nenhum resultado
      }
    } catch (error) {
      console.error(`Error fetching ${type} data:`, error);
      return null;
    }
  };

  if (isLoadingStatus || loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>A carregar dados de saúde...</Text>
      </View>
    );
  }

  if (!healthConnectStatus?.permissionsGranted) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>
          Conecte ao Health Connect para ver os seus dados de saúde
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.periodText}>Dados dos últimos 30 dias</Text>
      {lastSyncTime && (
        <Text style={styles.syncTimeText}>
          Última sincronização: {lastSyncTime.toLocaleTimeString()}
        </Text>
      )}

      <Metric
        label="❤️ Frequência Cardíaca Média"
        value={data.heartRate?.average}
        unit="bpm"
        subtitle={data.heartRate ? `${data.heartRate.count} medições` : null}
      />
      <Metric
        label="👣 Total de Passos"
        value={data.steps?.total}
        subtitle={data.steps ? `${data.steps.days} dias registrados` : null}
      />
      <Metric
        label="🩸 Pressão Arterial Média"
        value={
          data.bloodPressure
            ? `${data.bloodPressure.systolic}/${data.bloodPressure.diastolic}`
            : null
        }
        unit="mmHg"
        subtitle={
          data.bloodPressure ? `${data.bloodPressure.count} medições` : null
        }
      />
      <Metric
        label="🌡️ Temperatura Média"
        value={data.temperature?.average}
        unit="°C"
        subtitle={
          data.temperature ? `${data.temperature.count} medições` : null
        }
      />
      <Metric
        label="🫁 O2 Médio"
        value={data.oxygen?.average}
        unit="%"
        subtitle={data.oxygen ? `${data.oxygen.count} medições` : null}
      />
      <Metric
        label="🔥 Total de Calorias"
        value={data.calories?.total}
        unit="kcal"
        subtitle={
          data.calories ? `${data.calories.days} dias registrados` : null
        }
      />
      <Metric label="😵 Stress" value={null} />
    </ScrollView>
  );
}

const Metric: React.FC<MetricProps> = ({ label, value, unit, subtitle }) => (
  <View style={styles.card}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>
      {value !== null && value !== undefined
        ? `${value} ${unit || ""}`.trim()
        : "Sem dados"}
    </Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  periodText: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    fontStyle: "italic",
  },
  syncTimeText: {
    color: "#555",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 12,
    fontStyle: "italic",
  },
  card: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
  },
  label: {
    color: "#aaa",
    fontSize: 14,
  },
  value: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 4,
  },
  subtitle: {
    color: "#888",
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  loadingText: {
    color: "#666",
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  noDataText: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
  },
});
