import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import "../global.css";
import {
  registerHealthBackgroundSync,
  runSyncNow,
} from "@/src/tasks/healthBackgroundSync";
import useHealthConnectStatus from "@/hooks/useHealthConnectStatus";

const queryClient = new QueryClient();

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
  // Antes — corre sempre que isLoading ou permissionsGranted mudam
  useEffect(() => {
    if (!isLoading && healthConnectStatus?.permissionsGranted) {
      void registerHealthBackgroundSync();
      void runSyncNow();
    }
  }, [isLoading, healthConnectStatus?.permissionsGranted]);

  // Depois — corre só uma vez quando as permissões ficam prontas
  const hasRegistered = useRef(false);

  useEffect(() => {
    if (
      !isLoading &&
      healthConnectStatus?.permissionsGranted &&
      !hasRegistered.current
    ) {
      hasRegistered.current = true;
      void registerHealthBackgroundSync();
    }
  }, [isLoading, healthConnectStatus?.permissionsGranted]);
  if (!fontsLoaded) {
    return null;
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
