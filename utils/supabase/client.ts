import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

type StorageAdapter = {
  getItem: (key: string) => string | Promise<string | null> | null;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
};

const noopStorage: StorageAdapter = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const webStorage: StorageAdapter = {
  getItem: (key) => {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {}
  },
  removeItem: (key) => {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {}
  },
};

const isBrowser =
  Platform.OS === "web" && typeof window !== "undefined" && !!window.document;

const getStorage = () => {
  if (Platform.OS === "web") {
    return isBrowser ? webStorage : noopStorage;
  }

  return AsyncStorage;
};

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        storage: getStorage(),
        autoRefreshToken: true,
        persistSession: Platform.OS !== "web" || isBrowser,
        detectSessionInUrl: isBrowser,
      },
    })
  : null;

export const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error(
      "Supabase não está configurado. Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.",
    );
  }

  return supabase;
};
