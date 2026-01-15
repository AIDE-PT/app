import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Platform } from "react-native";

const API_BASE = Platform.select({
  android: "http://10.0.2.2:3000",
  default: "http://localhost:3000",
});

export function useHealthMetric(endpoint: string, isBP: boolean = false) {
  return useQuery({
    queryKey: [endpoint, "latest"],
    enabled: !!endpoint && endpoint !== "undefined", // Proteção extra
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/${endpoint}`);
      const data = response.data;

      if (!Array.isArray(data) || data.length === 0) return null;

      const sorted = data.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      const latest = sorted[0];
      const history = sorted.slice(0, 20).map((item: any) => {
        if (isBP && item.systolic !== undefined) {
          return Math.round((item.systolic + item.diastolic) / 2);
        }
        return item.value ?? 0;
      });

      return {
        displayValue: isBP
          ? `${latest.systolic}/${latest.diastolic}`
          : `${latest.value}`,
        history,
        latest,
      };
    },
    refetchInterval: 5000,
  });
}
