import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getSupabaseClient } from "@/utils/supabase/client";

export default function AuthCallback() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();

  useEffect(() => {
    if (!code) return;

    getSupabaseClient()
      .auth.exchangeCodeForSession(code as string)
      .then(({ error }) => {
        if (error) {
          console.error("Erro ao trocar code:", error);
          router.replace("/login");
        }
        // O AuthContext deteta SIGNED_IN e redireciona automaticamente
      });
  }, [code]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
