import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const SOS_CHANNEL_ID = "sos-alerts";

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(SOS_CHANNEL_ID, {
    name: "SOS Alerts",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 300, 200, 300],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    sound: "default",
  });
}

async function ensureNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (
    current.granted ||
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
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

  await ensureAndroidChannel();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "SOS Ativado",
      body: "Pedido de socorro enviado a partir deste dispositivo.",
      sound: "default",
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: null,
  });
}
