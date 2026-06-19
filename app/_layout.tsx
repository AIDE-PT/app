import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import useHealthConnectStatus from "@/hooks/useHealthConnectStatus";
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

  const { status: healthConnectStatus, isLoading } = useHealthConnectStatus();
  const hasStartedHealthSync = useRef(false);

  // Regista a task e faz 1 sync imediato quando as permissões ficam prontas.
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
          <UserProfileProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
            </Stack>
          </UserProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
