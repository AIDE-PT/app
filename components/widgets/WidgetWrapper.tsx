import React, { ReactNode } from "react";
import { Dimensions, Text, View, ViewStyle } from "react-native";
import SimpleLineChart from "../charts/LineChartSlim";
import MiniSparkline from "../charts/MiniSparkline";
import { IconType } from "../svg/WidgetIcon";

const { width: screenWidth } = Dimensions.get("window");

const GRID_PADDING = 16;
const GRID_GAP = 12;

const availableWidth = screenWidth - GRID_PADDING * 2;
const COLUMN_WIDTH = (availableWidth - GRID_GAP * 2) / 3;

export type WidgetVariant = "1-1" | "1-2" | "1-3" | "2-3";

const FEEDBACK_COLORS: Record<string, string> = {
  // Positive / Good -> Green
  normal: "#dcfce7", // green-100
  good: "#dcfce7",
  ok: "#dcfce7",
  estável: "#dcfce7",
  calm: "#dcfce7",
  meta: "#dcfce7",

  // Warning / Attention -> Yellow/Orange
  low: "#fef9c3", // yellow-100
  high: "#fef9c3",
  warning: "#fef9c3",

  // Bad / Critical -> Red
  bad: "#fee2e2", // red-100
  critical: "#fee2e2",
};

interface WidgetWrapperProps {
  title: string;
  variant: WidgetVariant;
  children?: React.ReactNode;
  bg?: string;
  style?: ViewStyle;
  icon: ReactNode;
  unit: string;
  feedback: string;
  feedbackColor: string;
  value: string;
  history?: number[];
}

interface DASHBOARD_CONFIGProps {
  id: string;
  type: IconType;
  variant: WidgetVariant;
  value: string;
  feedback: string;
  endpoint: string;
}

export const DASHBOARD_CONFIG: DASHBOARD_CONFIGProps[] = [
  {
    id: "heart",
    type: "heartRate",
    variant: "1-1",
    value: "73",
    feedback: "normal",
    endpoint: "bpm",
  },
  {
    id: "steps",
    type: "steps",
    variant: "1-2",
    value: "10.432",
    feedback: "meta",
    endpoint: "steps",
  },
  {
    id: "blood Pressure",
    type: "bloodPressure",
    variant: "1-3",
    value: "10.432",
    feedback: "meta",
    endpoint: "bloodPressure",
  },
  {
    id: "temp",
    type: "temp",
    variant: "2-3",
    value: "36.6",
    feedback: "estável",
    endpoint: "temperature",
  },
  {
    id: "sleep",
    type: "sleep",
    variant: "1-3",
    value: "7",
    feedback: "bom",
    endpoint: "sleep",
  },
  {
    id: "o2",
    type: "o2",
    variant: "1-1",
    value: "98",
    feedback: "normal",
    endpoint: "o2",
  },

  {
    id: "glycemia",
    type: "cal",
    variant: "1-1",
    value: "450",
    feedback: "meta",
    endpoint: "glycemia",
  },
  {
    id: "stress",
    type: "stress",
    variant: "1-1",
    value: "3",
    feedback: "baixo",
    endpoint: "stress",
  },
];

export const METRIC_STYLES: Record<
  IconType,
  {
    title: string;
    unit: string;
    color: string;
    feedbackColor: string;
  }
> = {
  heartRate: {
    title: "BPM",
    unit: "bpm",
    color: "#EF4444",
    feedbackColor: "#FACC15",
  },

  steps: {
    title: "PASSOS",
    unit: "steps",
    color: "#3B82F6",
    feedbackColor: "#10B981",
  },

  temp: {
    title: "TEMP",
    unit: "ºC",
    color: "#F59E0B",
    feedbackColor: "#FDE68A",
  },

  sleep: {
    title: "SONO",
    unit: "h",
    color: "#6366F1",
    feedbackColor: "#C7D2FE",
  },

  o2: {
    title: "O₂",
    unit: "%",
    color: "#06B6D4",
    feedbackColor: "#A5F3FC",
  },

  bloodPressure: {
    title: "BP",
    unit: "mmHg",
    color: "#EC4899",
    feedbackColor: "#FBCFE8",
  },

  cal: {
    title: "CAL",
    unit: "kcal",
    color: "#F97316",
    feedbackColor: "#FED7AA",
  },

  stress: {
    title: "STRESS",
    unit: "lvl",
    color: "#64748B",
    feedbackColor: "#CBD5E1",
  },
  glucose: {
    title: "GLICOSE",
    unit: "mg/dL",
    color: "#EC4899",
    feedbackColor: "#FCE7F3",
  },
};

export interface DashboardItem {
  id: string;
  type: IconType;
  variant: WidgetVariant;
}

export function WidgetWrapper({
  title,
  icon,
  variant,
  feedback,
  feedbackColor,
  unit,
  value,
  bg = "bg-white",
  style,
  history,
}: WidgetWrapperProps) {
  // TUA MATEMÁTICA ORIGINAL (Não mexer aqui)
  const u1 = COLUMN_WIDTH;
  const u2 = u1 * 2 + GRID_GAP;
  const u3 = u1 * 3 + GRID_GAP * 2;

  const getDims = () => {
    switch (variant) {
      case "1-1":
        return { width: u1, height: u1 };
      case "1-2":
        return { width: u2, height: u1 };
      case "1-3":
        return { width: u3, height: u1 };
      case "2-3":
        return { width: u3, height: u2 };
      default:
        return { width: u1, height: u1 };
    }
  };

  const { width, height } = getDims();

  return (
    <View
      style={[
        { width, height, boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" },
        style,
      ]}
      className={`${bg} rounded-[20px] p-2 justify-between border border-gray-100 overflow-hidden relative`}
    >
      {/* Header */}
      <View className="flex flex-row gap-2">
        {icon}
        <Text className="text-aide-light-blue text-sm font-open-sans gap-2 uppercase tracking-widest ">
          {title}
        </Text>
      </View>

      {/* Área de Valor - Flexível conforme o tamanho escolhido */}
      <View
        className={`${variant === "1-1" ? "flex-col" : "flex-row mb-auto justify-between items-end"} ml-2 mb-2`}
      >
        <View className="flex flex-row items-end">
          <Text
            style={{ color: "#000746" }}
            className="text-3xl font-bold leading-none"
          >
            {value}
          </Text>
          <Text className="text-xs text-gray-400 font-semibold ml-1 mb-1">
            {unit}
          </Text>
        </View>

        {feedback && variant !== "1-1" && (
          <View
            style={{
              backgroundColor:
                FEEDBACK_COLORS[feedback.toLowerCase()] ||
                feedbackColor ||
                "#E2E8F0",
            }}
            className="px-3 py-1 rounded-full mr-1"
          >
            <Text className="text-[10px] font-bold text-black uppercase">
              {feedback}
            </Text>
          </View>
        )}
      </View>

      {/* Só renderiza o gráfico se houver história e dados válidos */}
      {variant === "2-3" && history && history.length > 0 && (
        <SimpleLineChart
          data={[...history].reverse()}
          style={{ padding: 4 }}
          height={u2 - 60}
          width={u3 - 20}
        />
      )}

      {(variant === "1-3" || variant === "1-2") &&
        history &&
        history.length > 0 && (
          <View style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
            <MiniSparkline
              data={[...history].reverse()}
              width={width}
              height={24}
              color="#5C6CFF"
            />
          </View>
        )}
    </View>
  );
}
