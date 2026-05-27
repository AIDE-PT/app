/**
 * healthBackgroundSync.ts
 * Localização recomendada: src/tasks/healthBackgroundSync.ts
 *
 * Background polling task que lê dados do Health Connect e sincroniza
 * com o Supabase, com suporte a upsert, retry e verificação de permissões.
 *
 * Dependências necessárias:
 *   npx expo install expo-task-manager expo-background-fetch
 *
 * IMPORTANTE: Este ficheiro deve ser importado no topo do teu entry point
 * (App.tsx ou index.ts) para que o task manager registe a task antes
 * de qualquer rendering ocorrer.
 */

import { sendLocalDataEntryNotification } from "@/src/services/localNotifications";
import { supabase } from "@/utils/supabase/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    getGrantedPermissions,
    initialize,
    readRecords,
    type RecordResult,
} from "react-native-health-connect";
import { Platform } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Constantes ────────────────────────────────────────────────────────────────

const TASK_NAME = "HEALTH_CONNECT_BACKGROUND_SYNC";
const LAST_SYNC_STORAGE_KEY = "health_connect:last_sync_end_time";

/** Mínimo aceite pelo Android é 60s — valores abaixo são ignorados. */
const MINIMUM_INTERVAL_SECONDS = 60;

/** Número de tentativas em caso de falha de rede. */
const MAX_RETRIES = 3;

/** Espera entre tentativas em ms. */
const RETRY_DELAY_MS = 2000;

/** Janela de tempo do primeiro sync (dias atrás). */
const INITIAL_SYNC_DAYS = 30;

// ─── Tipos ─────────────────────────────────────────────────────────────────────

type HealthRecordType =
  | "HeartRate"
  | "Steps"
  | "BloodPressure"
  | "BodyTemperature"
  | "OxygenSaturation"
  | "TotalCaloriesBurned"
  | "SleepSession"
  | "TotalCaloriesBurned";

type BiometricDataInsert = {
  patient_id: string;
  biometric_data_type_id: string;
  value: number;
  value_secondary?: number | null;
  measured_at?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  source_app?: string | null;
  external_id?: string | null;
  last_modified?: string | null;
};

type HealthSnapshot = {
  timestamp: string;
  window: { start: string; end: string };
  heartRate: { average: number; count: number } | null;
  steps: { total: number; days: number } | null;
  bloodPressure: { systolic: number; diastolic: number; count: number } | null;
  temperature: { average: number; count: number } | null;
  oxygen: { average: number; count: number } | null;
  calories: { total: number; days: number } | null;
  sleep: { duration: number; count: number } | null;
};

type SyncedEntryNotification = {
  metric: HealthRecordType;
  value: number;
  valueSecondary?: number | null;
  measuredAt?: string | null;
};

type BackgroundFetchModule = typeof import("expo-background-fetch");
type TaskManagerModule = typeof import("expo-task-manager");
type BackgroundModules = {
  BackgroundFetch: BackgroundFetchModule;
  TaskManager: TaskManagerModule;
};

// Mapeamento dos tipos do Health Connect para os nomes na BD.
// Estes nomes têm de existir na tabela biometric_data_types.
const BIOMETRIC_TYPE_NAMES: Record<HealthRecordType, string> = {
  HeartRate: "heart_rate",
  Steps: "steps",
  BloodPressure: "blood_pressure",
  BodyTemperature: "body_temperature",
  OxygenSaturation: "oxygen_saturation",
  TotalCaloriesBurned: "total_calories_burned",
  SleepSession: "sleep",
};

const METRIC_NOTIFICATION_META: Record<
  HealthRecordType,
  { label: string; unit?: string }
> = {
  HeartRate: { label: "Frequencia cardiaca", unit: "bpm" },
  Steps: { label: "Passos", unit: "passos" },
  BloodPressure: { label: "Pressao arterial", unit: "mmHg" },
  BodyTemperature: { label: "Temperatura corporal", unit: "C" },
  OxygenSaturation: { label: "Saturacao de oxigenio", unit: "%" },
  TotalCaloriesBurned: { label: "Calorias", unit: "kcal" },
  SleepSession: { label: "Sono", unit: "h" },
};

// Permissões necessárias — usadas para verificação passiva (sem diálogo)
const REQUIRED_PERMISSIONS: {
  accessType: "read" | "write";
  recordType: HealthRecordType;
}[] = [
  { accessType: "read", recordType: "HeartRate" },
  { accessType: "read", recordType: "Steps" },
  { accessType: "read", recordType: "BloodPressure" },
  { accessType: "read", recordType: "BodyTemperature" },
  { accessType: "read", recordType: "OxygenSaturation" },
  { accessType: "read", recordType: "TotalCaloriesBurned" },
  { accessType: "read", recordType: "SleepSession" },
];

let cachedBackgroundModulesPromise: Promise<BackgroundModules | null> | null =
  null;
let taskDefined = false;

async function loadBackgroundModules(): Promise<BackgroundModules | null> {
  if (Platform.OS !== "android") return null;

  if (!cachedBackgroundModulesPromise) {
    cachedBackgroundModulesPromise = (async () => {
      try {
        const [BackgroundFetch, TaskManager] = await Promise.all([
          import("expo-background-fetch"),
          import("expo-task-manager"),
        ]);

        return { BackgroundFetch, TaskManager };
      } catch (error) {
        console.warn(
          "[HealthSync] Expo background modules indisponiveis neste runtime:",
          error,
        );
        return null;
      }
    })();
  }

  return cachedBackgroundModulesPromise;
}

// ─── Utilitários ───────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delayMs = RETRY_DELAY_MS,
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(
        `[HealthSync] Tentativa ${attempt}/${retries} falhou. A aguardar ${delayMs}ms...`,
      );
      await sleep(delayMs);
    }
  }
  throw new Error("withRetry: não devia chegar aqui");
}

/**
 * Verifica passivamente se as permissões estão concedidas.
 * NÃO abre nenhum diálogo — seguro para usar no background.
 */
async function checkPermissions(): Promise<boolean> {
  try {
    const granted = await getGrantedPermissions();
    return REQUIRED_PERMISSIONS.every((required) =>
      granted.some(
        (g) =>
          g.recordType === required.recordType &&
          g.accessType === required.accessType,
      ),
    );
  } catch {
    return false;
  }
}

// ─── AsyncStorage helpers ──────────────────────────────────────────────────────

async function getLastSyncEndTime(): Promise<Date | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AsyncStorage = require("@react-native-async-storage/async-storage")
      .default as { getItem: (key: string) => Promise<string | null> };
    const raw = await AsyncStorage.getItem(LAST_SYNC_STORAGE_KEY);
    if (!raw) return null;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

async function setLastSyncEndTime(endTimeIso: string): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AsyncStorage = require("@react-native-async-storage/async-storage")
      .default as { setItem: (key: string, value: string) => Promise<void> };
    await AsyncStorage.setItem(LAST_SYNC_STORAGE_KEY, endTimeIso);
  } catch {
    // ignorar falhas de storage
  }
}

// ─── Cache de IDs de biometria ─────────────────────────────────────────────────

const biometricTypeIdCache = new Map<string, string>();

async function getBiometricDataTypeIdByName(name: string): Promise<string> {
  const cached = biometricTypeIdCache.get(name);
  if (cached) return cached;

  const { data, error } = await supabase
    .from("biometric_data_types")
    .select("id")
    .eq("name", name)
    .maybeSingle();

  if (error) throw error;

  if (!data?.id) {
    throw new Error(
      `[HealthSync] Tipo de biometria desconhecido: "${name}". ` +
        `Adiciona-o à tabela biometric_data_types antes de sincronizar.`,
    );
  }

  biometricTypeIdCache.set(name, data.id);
  return data.id;
}

// ─── Leitura do Health Connect ─────────────────────────────────────────────────

async function readHealthRecords(
  type: HealthRecordType,
  startTime: Date,
  endTime: Date,
) {
  try {
    const res = await readRecords(type as any, {
      timeRangeFilter: {
        operator: "between",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
      ascendingOrder: true,
    });

    if (!res.records || res.records.length === 0) return null;

    const records = res.records;

    switch (type) {
      case "HeartRate": {
        const rates = records
          .flatMap((r) => {
            const hr = r as RecordResult<"HeartRate">;
            return hr.samples?.map((s: any) => s.beatsPerMinute) || [];
          })
          .filter((v) => v != null);
        if (rates.length === 0) return null;
        const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
        return { average: Math.round(avg), count: rates.length };
      }

      case "SleepSession": {
        console.log(
          "[HealthSync] SleepSession records[0]:",
          JSON.stringify(records[0], null, 2),
        );
        const total = records.reduce((sum, r) => {
          const s = r as RecordResult<"SleepSession">;
          console.log("[HealthSync] sleep record:", JSON.stringify(s, null, 2));
          const start = new Date(s.startTime).getTime();
          const end = new Date(s.endTime).getTime();
          return sum + (end - start) / (1000 * 60 * 60);
        }, 0);
        return total > 0
          ? { duration: Math.round(total * 10) / 10, count: records.length }
          : null;
      }
      case "Steps": {
        const total = records.reduce(
          (sum, r) => sum + ((r as RecordResult<"Steps">).count || 0),
          0,
        );
        return total > 0 ? { total, days: records.length } : null;
      }

      case "BloodPressure": {
        const sys = records
          .map((r) => (r as any).systolic?.inMillimetersOfMercury)
          .filter((v) => v != null && Number.isFinite(v)) as number[];
        const dia = records
          .map((r) => (r as any).diastolic?.inMillimetersOfMercury)
          .filter((v) => v != null && Number.isFinite(v)) as number[];
        if (sys.length === 0 || dia.length === 0) return null;
        return {
          systolic: Math.round(sys.reduce((a, b) => a + b, 0) / sys.length),
          diastolic: Math.round(dia.reduce((a, b) => a + b, 0) / dia.length),
          count: records.length,
        };
      }

      case "BodyTemperature": {
        const temps = records
          .map((r) => (r as any).temperature?.inCelsius)
          .filter((v) => v != null && Number.isFinite(v)) as number[];
        if (temps.length === 0) return null;
        const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
        return { average: Math.round(avg * 10) / 10, count: temps.length };
      }

      case "OxygenSaturation": {
        const vals = records
          .map((r) => (r as RecordResult<"OxygenSaturation">).percentage)
          .filter((v) => v != null);
        if (vals.length === 0) return null;
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        return { average: Math.round(avg * 10) / 10, count: vals.length };
      }

      case "TotalCaloriesBurned": {
        const total = records.reduce(
          (sum, r) =>
            sum +
            ((r as RecordResult<"TotalCaloriesBurned">).energy
              ?.inKilocalories || 0),
          0,
        );
        return total > 0
          ? { total: Math.round(total), days: records.length }
          : null;
      }

      default:
        return null;
    }
  } catch (err) {
    console.error(`[HealthSync] Erro a ler ${type}:`, err);
    return null;
  }
}

async function collectHealthSnapshot(
  start: Date,
  end: Date,
): Promise<HealthSnapshot> {
  // Criar cópias para não mutar os argumentos originais
  const startCopy = new Date(start);
  const endCopy = new Date(end);

  const [
    heartRate,
    steps,
    bloodPressure,
    temperature,
    oxygen,
    calories,
    sleepData,
  ] = await Promise.all([
    readHealthRecords("HeartRate", startCopy, endCopy),
    readHealthRecords("Steps", startCopy, endCopy),
    readHealthRecords("BloodPressure", startCopy, endCopy),
    readHealthRecords("BodyTemperature", startCopy, endCopy),
    readHealthRecords("OxygenSaturation", startCopy, endCopy),
    readHealthRecords("TotalCaloriesBurned", startCopy, endCopy),
    readHealthRecords("SleepSession", startCopy, endCopy),
  ]);

  return {
    timestamp: new Date().toISOString(),
    window: { start: startCopy.toISOString(), end: endCopy.toISOString() },
    heartRate: heartRate as HealthSnapshot["heartRate"],
    steps: steps as HealthSnapshot["steps"],
    bloodPressure: bloodPressure as HealthSnapshot["bloodPressure"],
    temperature: temperature as HealthSnapshot["temperature"],
    oxygen: oxygen as HealthSnapshot["oxygen"],
    calories: calories as HealthSnapshot["calories"],
    sleep: sleepData as HealthSnapshot["sleep"],
  };
}

// ─── Envio para o Supabase ─────────────────────────────────────────────────────

function buildExternalId(
  metricName: string,
  patientId: string,
  window: { start: string; end: string },
) {
  return `health_connect:${patientId}:${metricName}:${window.start}:${window.end}`;
}

function formatEntryValueForNotification(entry: SyncedEntryNotification): string {
  if (entry.metric === "BloodPressure" && entry.valueSecondary != null) {
    return `${entry.value}/${entry.valueSecondary} mmHg`;
  }

  const unit = METRIC_NOTIFICATION_META[entry.metric].unit;
  return unit ? `${entry.value} ${unit}` : String(entry.value);
}

async function notifySyncedEntries(
  entries: SyncedEntryNotification[],
): Promise<void> {
  let requestPermissionIfNeeded = true;

  for (const entry of entries) {
    try {
      await sendLocalDataEntryNotification({
        metricLabel: METRIC_NOTIFICATION_META[entry.metric].label,
        valueText: formatEntryValueForNotification(entry),
        measuredAt: entry.measuredAt,
        requestPermissionIfNeeded,
      });
      requestPermissionIfNeeded = false;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("permission denied")) {
        console.warn(
          "[HealthSync] Notificacoes sem permissao. Os dados continuam a sincronizar sem alerta.",
        );
        return;
      }

      console.warn("[HealthSync] Falha ao criar notificacao local:", error);
    }
  }
}

async function sendSnapshotToSupabase(snapshot: HealthSnapshot): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const patientId = userData.user?.id;
  if (!patientId) {
    console.warn("[HealthSync] Utilizador não autenticado — sync ignorado.");
    return;
  }

  const nowIso = new Date().toISOString();
  const rows: BiometricDataInsert[] = [];
  const notificationEntries: SyncedEntryNotification[] = [];

  const pushRow = async (
    metric: HealthRecordType,
    row: Omit<BiometricDataInsert, "patient_id" | "biometric_data_type_id">,
  ) => {
    const metricName = BIOMETRIC_TYPE_NAMES[metric];
    const biometricDataTypeId = await getBiometricDataTypeIdByName(metricName);
    rows.push({
      patient_id: patientId,
      biometric_data_type_id: biometricDataTypeId,
      source_app: "health_connect",
      external_id: buildExternalId(metricName, patientId, snapshot.window),
      last_modified: nowIso,
      ...row,
    });

    notificationEntries.push({
      metric,
      value: row.value,
      valueSecondary: row.value_secondary,
      measuredAt: row.measured_at,
    });
  };

  if (snapshot.heartRate) {
    await pushRow("HeartRate", {
      value: snapshot.heartRate.average,
      measured_at: snapshot.timestamp,
      start_time: snapshot.window.start,
      end_time: snapshot.window.end,
    });
  }

  if (snapshot.steps) {
    await pushRow("Steps", {
      value: snapshot.steps.total,
      measured_at: snapshot.timestamp,
      start_time: snapshot.window.start,
      end_time: snapshot.window.end,
    });
  }

  if (
    snapshot.bloodPressure?.systolic != null &&
    snapshot.bloodPressure?.diastolic != null
  ) {
    await pushRow("BloodPressure", {
      value: snapshot.bloodPressure.systolic,
      value_secondary: snapshot.bloodPressure.diastolic,
      measured_at: snapshot.timestamp,
      start_time: snapshot.window.start,
      end_time: snapshot.window.end,
    });
  }

  if (snapshot.temperature?.average != null) {
    await pushRow("BodyTemperature", {
      value: snapshot.temperature.average,
      measured_at: snapshot.timestamp,
      start_time: snapshot.window.start,
      end_time: snapshot.window.end,
    });
  }

  if (snapshot.oxygen) {
    await pushRow("OxygenSaturation", {
      value: snapshot.oxygen.average,
      measured_at: snapshot.timestamp,
      start_time: snapshot.window.start,
      end_time: snapshot.window.end,
    });
  }

  if (snapshot.calories) {
    await pushRow("TotalCaloriesBurned", {
      value: snapshot.calories.total,
      measured_at: snapshot.timestamp,
      start_time: snapshot.window.start,
      end_time: snapshot.window.end,
    });
  }

  if (snapshot.sleep) {
    await pushRow("SleepSession", {
      value: snapshot.sleep.duration, // horas dormidas
      measured_at: snapshot.timestamp,
      start_time: snapshot.window.start,
      end_time: snapshot.window.end,
    });
  }

  if (snapshot.sleep) {
    console.log(
      "[HealthSync] Sleep duration (horas):",
      snapshot.sleep.duration,
    );
  }

  if (rows.length === 0) {
    console.log("[HealthSync] Nenhum dado novo para enviar.");
    return;
  }

  // upsert — se o external_id já existir, atualiza em vez de duplicar
  const { error } = await supabase
    .from("biometric_data")
    .upsert(rows, { onConflict: "external_id" });

  if (error) throw error;

  await notifySyncedEntries(notificationEntries);

  console.log(`[HealthSync] ✅ ${rows.length} registo(s) sincronizado(s).`);
}

// ─── Lógica partilhada de sync ─────────────────────────────────────────────────

async function runSyncLogic(): Promise<void> {
  console.log("[HealthSync] 1. A inicializar...");
  const isInitialized = await initialize();
  console.log("[HealthSync] 2. isInitialized:", isInitialized);
  if (!isInitialized) {
    console.warn("[HealthSync] ⚠️  Health Connect não disponível.");
    return;
  }

  // Verificação passiva — NÃO abre diálogo, seguro no background
  console.log("[HealthSync] 3. A verificar permissões...");
  const hasPermissions = await checkPermissions();
  console.log("[HealthSync] 4. hasPermissions:", hasPermissions);
  if (!hasPermissions) {
    console.warn("[HealthSync] ⚠️  Permissões insuficientes — sync ignorado.");
    return;
  }
  console.log("[HealthSync] 5. A calcular janela temporal...");

  const end = new Date();
  const lastEnd = await getLastSyncEndTime();
  const start =
    lastEnd ??
    (() => {
      const fallback = new Date(end);
      fallback.setDate(fallback.getDate() - INITIAL_SYNC_DAYS);
      return fallback;
    })();

  console.log(
    `[HealthSync] 📅 Janela: ${start.toISOString()} → ${end.toISOString()}`,
  );
  console.log("[HealthSync] 6. A recolher snapshot...");

  const snapshot = await collectHealthSnapshot(start, end);
  console.log("[HealthSync] 7. Snapshot:", JSON.stringify(snapshot, null, 2));

  console.log("[HealthSync] 8. A enviar para Supabase...");
  await withRetry(() => sendSnapshotToSupabase(snapshot));
  console.log("[HealthSync] 9. Enviado!");
  await setLastSyncEndTime(snapshot.window.end);
}

// ─── Definição lazy da Task ───────────────────────────────────────────────────

async function ensureTaskIsDefined(): Promise<BackgroundModules | null> {
  const modules = await loadBackgroundModules();
  if (!modules) return null;
  if (taskDefined) return modules;

  const { TaskManager, BackgroundFetch } = modules;

  try {
    TaskManager.defineTask(TASK_NAME, async () => {
      console.log(
        `\n[HealthSync] ⏰ Task iniciada às ${new Date().toLocaleTimeString()}`,
      );

      try {
        await runSyncLogic();
        console.log(`[HealthSync] ✅ Sync completo`);
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (err) {
        console.error("[HealthSync] ❌ Erro na task:", err);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/already\s+defined/i.test(message)) {
      throw error;
    }
  }

  taskDefined = true;
  return modules;
}

// ─── API pública ───────────────────────────────────────────────────────────────

/**
 * Regista e activa o background polling.
 * Chamar uma vez após o utilizador conceder permissões Health Connect.
 */
export async function registerHealthBackgroundSync(): Promise<void> {
  const modules = await ensureTaskIsDefined();
  if (!modules) {
    console.warn("[HealthSync] Background polling indisponivel neste runtime.");
    return;
  }

  const { TaskManager, BackgroundFetch } = modules;

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
    if (isRegistered) {
      console.log("[HealthSync] ✅ Task já registada.");
      return;
    }

    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: MINIMUM_INTERVAL_SECONDS,
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log(
      `[HealthSync] ✅ Registado com sucesso (intervalo: ${MINIMUM_INTERVAL_SECONDS}s)`,
    );
  } catch (err) {
    console.error("[HealthSync] ❌ Erro ao registar:", err);
    throw err;
  }
}

/**
 * Remove o background polling.
 * Chamar quando o utilizador revoga permissões ou faz logout.
 */
export async function unregisterHealthBackgroundSync(): Promise<void> {
  const modules = await loadBackgroundModules();
  if (!modules) return;

  const { TaskManager, BackgroundFetch } = modules;

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(TASK_NAME);
      console.log("[HealthSync] 🛑 Background sync removido.");
    }
  } catch (err) {
    console.error("[HealthSync] ❌ Erro ao remover:", err);
  }
}

/**
 * Verifica o estado actual da task (útil para debug).
 */
export async function getHealthSyncStatus(): Promise<{
  isRegistered: boolean;
  fetchStatus: number | null;
}> {
  const modules = await loadBackgroundModules();
  if (!modules) {
    return { isRegistered: false, fetchStatus: null };
  }

  const { TaskManager, BackgroundFetch } = modules;
  const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
  const fetchStatus = await BackgroundFetch.getStatusAsync();
  return { isRegistered, fetchStatus };
}

/**
 * Corre o sync imediatamente sem depender do background scheduler.
 * Útil para testar em desenvolvimento.
 *
 * Exemplo de uso:
 *   import { runSyncNow } from "@/src/tasks/healthBackgroundSync";
 *   <Button title="Forçar Sync" onPress={() => void runSyncNow()} />
 */
export async function runSyncNow(): Promise<void> {
  try {
    // Limpa o último sync para forçar janela de 30 dias
    await AsyncStorage.removeItem(LAST_SYNC_STORAGE_KEY);
    await runSyncLogic();
    console.log("[HealthSync] ✅ Sync Automatico completo");
  } catch (err) {
    console.error("[HealthSync] ❌ Erro no sync Automatico:", err);
    throw err;
  }
}

export { TASK_NAME };

