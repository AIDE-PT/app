import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ConsentPrivacyProvider } from "@/contexts/ConsentPrivacyContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import {
  UserProfileProvider,
  useUserProfile,
} from "@/contexts/UserProfileContext";
import useHealthConnectStatus from "@/hooks/useHealthConnectStatus";
import { registerDevicePushToken } from "@/src/services/pushNotifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Constants from "expo-constants";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import "../global.css";

const queryClient = new QueryClient();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore race-condition errors if splash is already hidden.
});

function PushNotificationRegistration() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !user?.id) return;

    registerDevicePushToken(user.id).catch((error) => {
      console.warn(
        "[PushNotifications] Failed to register device token",
        error,
      );
    });
  }, [isLoading, user?.id]);

  return null;
}

function CuidadoHealthConnectSyncRegistration() {
  const { status: healthConnectStatus, isLoading } = useHealthConnectStatus();
  const hasStartedHealthSync = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (!healthConnectStatus?.permissionsGranted) return;
    if (hasStartedHealthSync.current) return;

    if (Platform.OS !== "android") return;
    if (Constants.executionEnvironment === "storeClient") {
      // Expo Go does not include expo-task-manager native module.
      return;
    }

    hasStartedHealthSync.current = true;

    void (async () => {
      try {
        const { registerHealthBackgroundSync, runSyncNow } =
          await import("@/src/tasks/healthBackgroundSync");
        await registerHealthBackgroundSync();
        await runSyncNow();
      } catch (error) {
        console.warn(
          "[HealthSync] Failed to initialize background sync",
          error,
        );
        hasStartedHealthSync.current = false;
      }
    })();
  }, [isLoading, healthConnectStatus?.permissionsGranted]);

  return null;
}

function HealthConnectSyncRegistration() {
  const { profileType } = useUserProfile();

  if (profileType !== "cuidado") return null;

  return <CuidadoHealthConnectSyncRegistration />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Safiro-Medium": require("../assets/fonts/safiro/safiro-medium-webfont.ttf"),
    "OpenSans-Regular": require("../assets/fonts/open-sans/OpenSans-Regular.ttf"),
    "OpenSans-SemiBold": require("../assets/fonts/open-sans/OpenSans-SemiBold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
        }}
      >
        <ActivityIndicator size="large" color="#5061FF" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <PushNotificationRegistration />
          <ConsentPrivacyProvider>
            <UserProfileProvider>
              <HealthConnectSyncRegistration />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
              </Stack>
            </UserProfileProvider>
          </ConsentPrivacyProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
