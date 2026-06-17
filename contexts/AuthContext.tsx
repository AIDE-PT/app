/* eslint-disable react-hooks/exhaustive-deps */
import { supabase } from "@/utils/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "expo-router";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";

const DEFAULT_AUTH_REDIRECT = "/testDashboard";
const PUBLIC_AUTH_ROUTES = ["/", "/login", "/register", "/recover-password"];
const PROTECTED_ROUTES = [
  "/testDashboard",
  "/perfil",
  "/definicoes",
  "/gerir_perfil",
  "/historicoDiario",
  "/recommendations",
  "/terms-of-service",
];

const stripQueryString = (path: string) => path.split("?")[0];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  signOut: () => Promise<void>;
  getCurrentAccessToken: () => Promise<string | null>;
  fetchWithAuth: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const pathname = usePathname();

  const currentPath = () => {
    const query = typeof window !== "undefined" ? window.location.search : "";
    return `${pathname}${query}`;
  };

  const isPublicAuthRoute = (path: string) =>
    PUBLIC_AUTH_ROUTES.includes(stripQueryString(path));

  const isProtectedRoute = (path: string) =>
    PROTECTED_ROUTES.includes(stripQueryString(path));

  const buildLoginPath = (next?: string) => {
    if (!next) return "/login";
    return `/login?next=${encodeURIComponent(next)}`;
  };

  const handleSession = (sessionData: Session | null) => {
    setSession(sessionData);
  };

  const redirectToLoginIfNeeded = (path: string) => {
    if (isProtectedRoute(path)) {
      router.replace(buildLoginPath(path) as any);
    }
  };

  const redirectToAuthHomeIfNeeded = (
    path: string,
    activeSession: Session | null = session,
  ) => {
    if (activeSession && isPublicAuthRoute(path)) {
      router.replace(DEFAULT_AUTH_REDIRECT as any);
    }
  };

  const syncSession = async () => {
    try {
      const {
        data: { session: restoredSession },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Supabase session restore failed:", error.message);
        await supabase.auth.signOut();
        handleSession(null);
        return;
      }

      handleSession(restoredSession);
      redirectToAuthHomeIfNeeded(currentPath(), restoredSession);
    } catch (error) {
      console.error("Unexpected session restore error:", error);
      handleSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, sessionData) => {
        switch (event) {
          case "SIGNED_OUT":
            handleSession(null);
            redirectToLoginIfNeeded(currentPath());
            return;
          case "SIGNED_IN":
          case "USER_UPDATED":
          case "TOKEN_REFRESHED":
            handleSession(sessionData ?? null);
            if (event === "SIGNED_IN") {
              const searchParams = new URLSearchParams(
                typeof window !== "undefined" ? window.location.search : "",
              );
              const next = searchParams.get("next") ?? DEFAULT_AUTH_REDIRECT;
              router.replace(next as any);
            }
            return;
          default:
            if (!sessionData) {
              handleSession(null);
              redirectToLoginIfNeeded(currentPath());
            }
        }
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    const handleStorageEvent = async (event: StorageEvent) => {
      if (!event.key?.startsWith("sb:")) return;

      const {
        data: { session: restoredSession },
      } = await supabase.auth.getSession();

      if (!restoredSession) {
        handleSession(null);
        redirectToLoginIfNeeded(currentPath());
      }
    };

    window.addEventListener("storage", handleStorageEvent);
    return () => {
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [router]);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
      handleSession(null);
      // Explicit logout should not preserve a "next" redirect.
      router.replace("/login" as any);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const getCurrentAccessToken = async () => {
    const {
      data: { session: currentSession },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Error fetching current access token:", error.message);
      return null;
    }

    return currentSession?.access_token ?? null;
  };

  const fetchWithAuth = async (
    input: RequestInfo,
    init?: RequestInit,
  ): Promise<Response> => {
    const accessToken = await getCurrentAccessToken();
    const headers = new Headers(init?.headers ?? undefined);

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const response = await fetch(input, {
      ...init,
      headers,
    });

    if (response.status === 401) {
      await supabase.auth.signOut();
      handleSession(null);
      redirectToLoginIfNeeded(currentPath());
    }

    return response;
  };

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      isAuthenticated: Boolean(session?.user),
      accessToken: session?.access_token ?? null,
      refreshToken: session?.refresh_token ?? null,
      signOut,
      getCurrentAccessToken,
      fetchWithAuth,
    }),
    [session, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
