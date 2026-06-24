import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { ensureSOSNotificationChannel } from "./pushNotifications";

const DATA_ENTRY_CHANNEL_ID = "health-data-entry";

async function ensureAndroidChannel(
  channelId: string,
  name: string,
  importance = Notifications.AndroidImportance.DEFAULT,
) {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(channelId, {
    name,
    importance,
    vibrationPattern: [0, 200, 100, 200],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

async function ensureNotificationPermission(options?: {
  requestIfNeeded?: boolean;
}) {
  const requestIfNeeded = options?.requestIfNeeded ?? true;
  const current = await Notifications.getPermissionsAsync();
  if (
    current.granted ||
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }

  if (!requestIfNeeded) {
    return false;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return Boolean(
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL,
  );
}

export async function sendLocalSOSNotification() {
  const hasPermission = await ensureNotificationPermission();

  if (!hasPermission) {
    throw new Error("Notifications permission denied.");
  }

  await ensureSOSNotificationChannel();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "SOS Ativado",
      body: "Pedido de socorro enviado a partir deste dispositivo.",
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: null,
  });
}

type DataEntryNotificationOptions = {
  metricLabel: string;
  valueText: string;
  measuredAt?: string | null;
  requestPermissionIfNeeded?: boolean;
  title?: string;
  body?: string;
};

function formatMeasuredAt(measuredAt?: string | null): string {
  if (!measuredAt) return "";

  const date = new Date(measuredAt);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function sendLocalDataEntryNotification({
  metricLabel,
  valueText,
  measuredAt,
  requestPermissionIfNeeded = true,
  title,
  body,
}: DataEntryNotificationOptions) {
  const hasPermission = await ensureNotificationPermission({
    requestIfNeeded: requestPermissionIfNeeded,
  });

  if (!hasPermission) {
    throw new Error("Notifications permission denied.");
  }

  await ensureAndroidChannel(
    DATA_ENTRY_CHANNEL_ID,
    "Entradas de dados",
    Notifications.AndroidImportance.HIGH,
  );

  const measuredAtLabel = formatMeasuredAt(measuredAt);
  const measuredAtSuffix = measuredAtLabel ? ` as ${measuredAtLabel}` : "";

  await Notifications.scheduleNotificationAsync({
    content: {
      title: title ?? `Novo dado recebido: ${metricLabel}`,
      body: body ?? `Valor: ${valueText}${measuredAtSuffix}.`,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
}
