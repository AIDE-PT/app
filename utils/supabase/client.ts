import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

const isNodeRuntime =
  typeof globalThis !== "undefined" &&
  typeof (globalThis as { process?: { versions?: { node?: string } } }).process
    ?.versions?.node === "string";

const getStorage = () => {
  if (isNodeRuntime) return undefined;

  if (Platform.OS === "web") {
    const webStorage =
      typeof globalThis !== "undefined" ? globalThis.localStorage : undefined;

    if (webStorage) return webStorage;
  }

  return AsyncStorage;
};

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        storage: getStorage(),
        autoRefreshToken: !isNodeRuntime,
        persistSession: !isNodeRuntime,
        detectSessionInUrl: Platform.OS === "web" && !isNodeRuntime,
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
