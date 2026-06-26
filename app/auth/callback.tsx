import { getSupabaseClient } from "@/utils/supabase/client";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function AuthCallback() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // Verificar se a sessão já foi estabelecida (ex.: por useGoogleAuth).
      const {
        data: { session: existing },
      } = await getSupabaseClient().auth.getSession();

      if (existing?.user?.id) {
        await routeAfterSession(existing.user.id, router);
        return;
      }

      // Sessão não existe — tentar trocar o code.
      if (!code) {
        router.replace("/login");
        return;
      }

      const { data, error } = await getSupabaseClient().auth.exchangeCodeForSession(
        code as string,
      );

      if (error || !data.session?.user?.id) {
        console.error("Erro ao trocar code:", error);
        router.replace("/login");
        return;
      }

      await routeAfterSession(data.session.user.id, router);
    };

    void handleCallback();
  }, [code]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

async function routeAfterSession(
  userId: string,
  router: ReturnType<typeof useRouter>,
) {
  const { data: userRow, error } = await getSupabaseClient()
    .from("users")
    .select("user_type_id")
    .eq("id", userId)
    .maybeSingle();

  if (!error && !userRow?.user_type_id) {
    router.replace("/terms-of-service?fromStart=true");
    return;
  }

  router.replace("/testDashboard");
}
