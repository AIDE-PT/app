import { getSupabaseClient, hasSupabaseConfig } from "@/utils/supabase/client";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const SOS_CHANNEL_ID = "sos-alerts";
const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const EXPO_PUSH_TOKEN_PATTERN = /^(ExponentPushToken|ExpoPushToken)\[.+\]$/;

type SosTarget = {
  aider_id: string;
  expo_push_token: string | null;
};

type HealthDataTarget = SosTarget & {
  push_title: string;
  push_body: string;
};

export type SosPushResult = {
  aiderCount: number;
  sentPushCount: number;
};

const getProjectId = () =>
  Constants.easConfig?.projectId ??
  Constants.expoConfig?.extra?.eas?.projectId ??
  Constants.expoConfig?.extra?.projectId;

export async function ensureSOSNotificationChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(SOS_CHANNEL_ID, {
    name: "SOS Alerts",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 200, 100, 200],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
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

export async function registerDevicePushToken(userId: string) {
  if (!hasSupabaseConfig || Platform.OS === "web") return null;

  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) return null;

  await ensureSOSNotificationChannel();

  const projectId = getProjectId();
  if (!projectId) {
    throw new Error("Expo projectId em falta para registar push token.");
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  const expoPushToken = token.data;

  const { error } = await getSupabaseClient().from("push_tokens").upsert(
    {
      user_id: userId,
      expo_push_token: expoPushToken,
      device_platform: Platform.OS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,expo_push_token" },
  );

  if (error) {
    throw new Error(`Nao foi possivel registar push token: ${error.message}`);
  }

  return expoPushToken;
}

export async function sendSOSPushToAiders(): Promise<SosPushResult> {
  if (!hasSupabaseConfig) {
    return { aiderCount: 0, sentPushCount: 0 };
  }

  const { data, error } = await getSupabaseClient().rpc("dispatch_sos_alert");

  if (error) {
    throw new Error(`Nao foi possivel enviar SOS: ${error.message}`);
  }

  const targets = (Array.isArray(data) ? data : []) as SosTarget[];
  const aiderIds = new Set(targets.map((target) => target.aider_id));
  const expoPushTokens = Array.from(
    new Set(
      targets
        .map((target) => target.expo_push_token)
        .filter((token): token is string =>
          Boolean(token && EXPO_PUSH_TOKEN_PATTERN.test(token)),
        ),
    ),
  );

  if (expoPushTokens.length === 0) {
    return { aiderCount: aiderIds.size, sentPushCount: 0 };
  }

  const messages = expoPushTokens.map((to) => ({
    to,
    title: "SOS ativado",
    body: "Um cuidado associado ativou o pedido de socorro.",
    priority: "high",
    channelId: SOS_CHANNEL_ID,
    data: { type: "sos" },
  }));

  const response = await fetch(EXPO_PUSH_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    throw new Error(`Expo Push respondeu com HTTP ${response.status}.`);
  }

  return {
    aiderCount: aiderIds.size,
    sentPushCount: expoPushTokens.length,
  };
}

export async function sendHealthDataPushToAiders({
  title,
  body,
}: {
  title: string;
  body: string;
}): Promise<SosPushResult> {
  if (!hasSupabaseConfig) {
    return { aiderCount: 0, sentPushCount: 0 };
  }

  const { data, error } = await getSupabaseClient().rpc(
    "dispatch_health_data_notification",
    {
      p_title: title,
      p_content: body,
    },
  );

  if (error) {
    throw new Error(
      `Nao foi possivel enviar notificacao aos aiders: ${error.message}`,
    );
  }

  const targets = (Array.isArray(data) ? data : []) as HealthDataTarget[];
  const aiderIds = new Set(targets.map((target) => target.aider_id));
  const expoPushTokens = Array.from(
    new Set(
      targets
        .map((target) => target.expo_push_token)
        .filter((token): token is string =>
          Boolean(token && EXPO_PUSH_TOKEN_PATTERN.test(token)),
        ),
    ),
  );

  if (expoPushTokens.length === 0) {
    return { aiderCount: aiderIds.size, sentPushCount: 0 };
  }

  const firstTarget = targets.find((target) => target.push_title);
  const messages = expoPushTokens.map((to) => ({
    to,
    title: firstTarget?.push_title ?? title,
    body: firstTarget?.push_body ?? body,
    priority: "high",
    channelId: SOS_CHANNEL_ID,
    data: { type: "health_data" },
  }));

  const response = await fetch(EXPO_PUSH_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    throw new Error(`Expo Push respondeu com HTTP ${response.status}.`);
  }

  return {
    aiderCount: aiderIds.size,
    sentPushCount: expoPushTokens.length,
  };
}
