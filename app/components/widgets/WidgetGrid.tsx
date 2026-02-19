import React from "react";
import { Dimensions, LayoutChangeEvent, ScrollView, View } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

export const GRID_PADDING = 16;
export const GRID_GAP = 10; // Reduzi um pouco o gap para caberem 3 colunas confortavelmente
// Cálculo: (Largura Total - Margens Laterais - Espaços entre as 3 colunas) / 3
export const BASE_UNIT = (screenWidth - GRID_PADDING * 2 - GRID_GAP * 2) / 3;

interface WidgetGridProps {
  children: React.ReactNode;
  className?: string;
  contentRef?: React.RefObject<View | null>;
  onContentLayout?: (event: LayoutChangeEvent) => void;
  scrollEnabled?: boolean;
}

export default function WidgetGrid({
  children,
  className,
  contentRef,
  onContentLayout,
  scrollEnabled = true,
}: WidgetGridProps) {
  if (!scrollEnabled) {
    return (
      <View
        className={className}
        style={{ padding: GRID_PADDING, paddingBottom: 100 }}
      >
        <View
          ref={contentRef}
          onLayout={onContentLayout}
          className="flex-row flex-wrap justify-start"
          style={{ gap: GRID_GAP }}
        >
          {children}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      scrollEnabled={scrollEnabled}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: GRID_PADDING, paddingBottom: 100 }}
      className={className}
    >
      <View
        ref={contentRef}
        onLayout={onContentLayout}
        className="flex-row flex-wrap justify-start"
        style={{ gap: GRID_GAP }}
      >
        {children}
      </View>
    </ScrollView>
  );
}
