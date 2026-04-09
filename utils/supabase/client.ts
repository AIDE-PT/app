import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl) throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL");
if (!supabaseKey)
  throw new Error("Missing EXPO_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY");

const getStorage = () => {
  // SSR / Node.js — sem storage
  if (typeof window === "undefined") return undefined;

  // Web browser — usa localStorage
  if (Platform.OS === "web") return localStorage;

  // Android / iOS — usa AsyncStorage
  const {
    default: AsyncStorage,
  } = require("@react-native-async-storage/async-storage");
  return AsyncStorage;
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});
