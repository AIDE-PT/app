import React from "react";
import { View, ScrollView, Dimensions } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

export const GRID_PADDING = 16;
export const GRID_GAP = 10; // Reduzi um pouco o gap para caberem 3 colunas confortavelmente
// Cálculo: (Largura Total - Margens Laterais - Espaços entre as 3 colunas) / 3
export const BASE_UNIT = (screenWidth - GRID_PADDING * 2 - GRID_GAP * 2) / 3;

interface WidgetGridProps {
  children: React.ReactNode;
  className?: string;
}

export default function WidgetGrid({ children, className }: WidgetGridProps) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: GRID_PADDING, paddingBottom: 100 }}
      className={className}
    >
      <View
        className="flex-row flex-wrap justify-start"
        style={{ gap: GRID_GAP }}
      >
        {children}
      </View>
    </ScrollView>
  );
}
