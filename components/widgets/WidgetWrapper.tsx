import React, { ReactNode } from 'react';
import { View, Text, Dimensions, ViewStyle } from 'react-native';
import SimpleLineChart from '../charts/LineChartSlim';
import MiniSparkline from '../charts/MiniSparkline';
import { IconType } from '../svg/WidgetIcon';

const { width: screenWidth } = Dimensions.get('window');

const GRID_PADDING = 16;
const GRID_GAP = 12;

const availableWidth = screenWidth - (GRID_PADDING * 2);
const COLUMN_WIDTH = (availableWidth - (GRID_GAP * 2)) / 3;

export type WidgetVariant = "1-1" | "1-2" | "1-3" | "2-3";

interface WidgetWrapperProps {
  title: string;
  variant: WidgetVariant;
  children?: React.ReactNode;
  bg?: string;
  style?: ViewStyle;
  icon: ReactNode
  unit: string,
  feedback: string,
  feedbackColor: string,
  value: string,

}

interface DASHBOARD_CONFIGProps { id: string, type: IconType, variant: WidgetVariant, value: string, feedback: string }


export const DASHBOARD_CONFIG: DASHBOARD_CONFIGProps[] = [
  { id: 'heart', type: 'heartRate', variant: '1-1', value: '73', feedback: 'normal' },
  { id: 'steps', type: 'steps', variant: '1-2', value: '10.432', feedback: 'meta' },
  { id: 'temp', type: 'temp', variant: '2-3', value: '36.6', feedback: 'estável' },
];

// Mapeamento de estilos para manter o WidgetWrapper limpo
export const METRIC_STYLES = {
  heartRate: { title: "BPM", unit: "bpm", color: "#EF4444", feedbackColor: "#FFCC00" },
  steps: { title: "PASSOS", unit: "steps", color: "#3B82F6", feedbackColor: "#10B981" },
  temp: { title: "TEMP", unit: "ºC", color: "#F59E0B", feedbackColor: "#DBEAFE" },
};


export function WidgetWrapper({
  title, icon, variant, feedback, feedbackColor, unit, value, bg = "bg-white", style
}: WidgetWrapperProps) {

  // TUA MATEMÁTICA ORIGINAL (Não mexer aqui)
  const u1 = COLUMN_WIDTH - GRID_GAP;
  const u2 = (u1 * 2) + GRID_GAP;
  const u3 = (u1 * 3) + (GRID_GAP * 2);

  const getDims = () => {
    switch (variant) {
      case "1-1": return { width: u1, height: u1 };
      case "1-2": return { width: u2, height: u1 };
      case "1-3": return { width: u3, height: u1 };
      case "2-3": return { width: u3, height: u2 };
      default: return { width: u1, height: u1 };
    }
  };

  const { width, height } = getDims();

  return (
    <View
      style={[{ width, height, boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.12)' }, style]}
      className={`${bg} rounded-[16px] p-2 justify-between border border-gray-100 overflow-hidden relative`}
    >
      {/* Header */}
      <View className='flex flex-row gap-2'>
        {icon}
        <Text className="text-aide-light-blue text-sm font-open-sans-semibold gap-2 uppercase tracking-widest ">
          {title}
        </Text>
      </View>

      {/* Área de Valor - Flexível conforme o tamanho escolhido */}
      <View className={`${variant === "1-1" ? "flex-col" : "flex-row mb-auto justify-between items-end"} ml-2 mb-2`}>
        <View className='flex flex-row items-end'>
          <Text className="text-3xl font-bold text-red-500 leading-none">{value}</Text>
          <Text className="text-xs text-gray-400 font-semibold ml-1 mb-1">{unit}</Text>
        </View>

        {feedback && variant !== "1-1" && (
          <View style={{ backgroundColor: feedbackColor }} className="px-3 py-1 rounded-full mr-1">
            <Text className="text-[10px] font-bold text-black uppercase">{feedback}</Text>
          </View>
        )}
      </View>

      {/* Lógica do Gráfico */}
      {variant === "2-3" && <SimpleLineChart style={{ padding: 4 }} height={u2 - 60} width={u3 - 20} />}

      {(variant === "1-3" || variant === "1-2") && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <MiniSparkline
            data={[100, 102, 101, 103, 103, 102, 104, 105, 103, 106, 108]}
            width={width} // Ocupa a largura total da variante escolhida
            height={20}
            color="#5C6CFF"
          />
        </View>
      )}
    </View>
  );
}