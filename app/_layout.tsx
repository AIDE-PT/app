import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "../global.css";

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
      SplashScreen.hideAsync().catch(() => {
        // Ignore race-condition errors if splash is already hidden.
      });
    }
  }, [fontsLoaded]);

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
