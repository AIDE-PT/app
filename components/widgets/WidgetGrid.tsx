import React from "react";
import { Dimensions, LayoutChangeEvent, ScrollView, View } from "react-native";
import { surfaceSpacing } from "../surface/surfaceStyles";

const { width: screenWidth } = Dimensions.get("window");

export const GRID_PADDING = surfaceSpacing.md;
export const GRID_GAP = surfaceSpacing.sm;
export const GRID_BOTTOM_PADDING = surfaceSpacing.xl * 3;
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
        style={{ padding: GRID_PADDING, paddingBottom: GRID_BOTTOM_PADDING }}
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
      contentContainerStyle={{
        padding: GRID_PADDING,
        paddingBottom: GRID_BOTTOM_PADDING,
      }}
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
