import { getSupabaseClient, hasSupabaseConfig } from "@/utils/supabase/client";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Platform } from "react-native";

// Garante que a sessão do browser fecha após a autenticação (nativo).
WebBrowser.maybeCompleteAuthSession();

// Troca o code do callback pela sessão (fluxo PKCE, apenas nativo).
async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) throw new Error(errorCode);
  const { code } = params;
  if (!code) {
    throw new Error("Code não encontrado na URL de callback.");
  }

  const { error } = await getSupabaseClient().auth.exchangeCodeForSession(code);
  if (error) throw error;
}

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = async () => {
    if (!hasSupabaseConfig) {
      setError("Supabase não está configurado.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (Platform.OS === "web") {
        // Na web, deixamos o Supabase fazer o redirect completo da página.
        // O detectSessionInUrl trata da troca do code automaticamente.
        const origin =
          typeof window !== "undefined" ? window.location.origin : undefined;

        const { error: oauthError } =
          await getSupabaseClient().auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: origin },
          });

        if (oauthError) throw oauthError;
        return;
      }

      // Fluxo nativo: scheme da app + browser de autenticação.
      const redirectTo = makeRedirectUri({
        scheme: "aide",
        path: "auth/callback",
      });

      const { data, error: oauthError } =
        await getSupabaseClient().auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            skipBrowserRedirect: true,
          },
        });

      if (oauthError) throw oauthError;
      if (!data.url) {
        throw new Error("URL de autenticação não recebida do Supabase.");
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );

      if (result.type === "success") {
        await createSessionFromUrl(result.url);
        // O AuthContext deteta SIGNED_IN e o login.tsx redireciona.
      }
    } catch (err: any) {
      console.error("Erro na autenticação Google:", err);
      setError(err?.message ?? "Erro desconhecido na autenticação Google.");
    } finally {
      setLoading(false);
    }
  };

  return { signInWithGoogle, loading, error };
}
