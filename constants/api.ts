import { Platform } from "react-native";

export const LOCAL_API_BASE =
  process.env.EXPO_PUBLIC_LOCAL_API_URL ??
  Platform.select({
    android: "http://10.0.2.2:3000",
    default: "http://localhost:3000",
  });
