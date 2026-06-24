import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getSupabaseClient } from "@/utils/supabase/client";

export default function AuthCallback() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();

  useEffect(() => {
    if (!code) return;

    const handleCallback = async () => {
      const { data, error } = await getSupabaseClient().auth.exchangeCodeForSession(
        code as string,
      );

      if (error) {
        console.error("Erro ao trocar code:", error);
        router.replace("/login");
        return;
      }

      // Utilizador novo (sem user_type_id na tabela users) segue para o
      // onboarding. Caso contrário, deixa o AuthContext tratar do redirect normal.
      const userId = data.session?.user?.id;
      if (!userId) return;

      const { data: userRow, error: userError } = await getSupabaseClient()
        .from("users")
        .select("user_type_id")
        .eq("id", userId)
        .maybeSingle();

      if (!userError && !userRow?.user_type_id) {
        router.replace("/terms-of-service?fromStart=true");
      }
    };

    void handleCallback();
  }, [code]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
