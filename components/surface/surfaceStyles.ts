import { Platform, type ViewStyle } from "react-native";

export type SurfaceLevel = "base" | "elevated" | "highlight";

type SurfaceToken = {
  backgroundColor: string;
  borderColor: string;
  shadow?: ShadowToken;
};

type ShadowToken = {
  color: string;
  offset: { width: number; height: number };
  opacity: number;
  radius: number;
  elevation: number;
  web: string;
};

const surfaceTokens: Record<
  "light" | "dark",
  Record<SurfaceLevel, SurfaceToken>
> = {
  light: {
    base: {
      backgroundColor: "rgba(255, 255, 255, 0.76)",
      borderColor: "rgba(80, 97, 255, 0.14)",
    },
    elevated: {
      backgroundColor: "rgba(255, 255, 255, 0.92)",
      borderColor: "rgba(80, 97, 255, 0.2)",
      shadow: {
        color: "#000000",
        offset: { width: 0, height: 2 },
        opacity: 0.12,
        radius: 8,
        elevation: 3,
        web: "0 2px 8px 0 rgba(0, 0, 0, 0.12)",
      },
    },
    highlight: {
      backgroundColor: "rgba(80, 97, 255, 0.12)",
      borderColor: "rgba(80, 97, 255, 0.55)",
      shadow: {
        color: "#5061FF",
        offset: { width: 0, height: 3 },
        opacity: 0.22,
        radius: 12,
        elevation: 4,
        web: "0 3px 12px 0 rgba(80, 97, 255, 0.22)",
      },
    },
  },
  dark: {
    base: {
      backgroundColor: "rgba(0, 4, 18, 0.72)",
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    elevated: {
      backgroundColor: "rgba(19, 22, 50, 0.92)",
      borderColor: "rgba(255, 255, 255, 0.14)",
      shadow: {
        color: "#000000",
        offset: { width: 0, height: 2 },
        opacity: 0.3,
        radius: 8,
        elevation: 3,
        web: "0 2px 8px 0 rgba(0, 0, 0, 0.3)",
      },
    },
    highlight: {
      backgroundColor: "rgba(80, 97, 255, 0.24)",
      borderColor: "rgba(124, 137, 255, 0.72)",
      shadow: {
        color: "#000000",
        offset: { width: 0, height: 3 },
        opacity: 0.34,
        radius: 12,
        elevation: 4,
        web: "0 3px 12px 0 rgba(0, 0, 0, 0.34)",
      },
    },
  },
};

export const surfaceSpacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

export const surfaceRadius = {
  sm: 12,
  md: 20,
  lg: 28,
};

export function getSurfaceStyle(
  level: SurfaceLevel,
  isDark: boolean,
  overrides: ViewStyle = {},
): ViewStyle {
  const token = surfaceTokens[isDark ? "dark" : "light"][level];

  return {
    backgroundColor: token.backgroundColor,
    borderColor: token.borderColor,
    borderRadius: surfaceRadius.md,
    borderWidth: 1,
    ...getSurfaceShadowStyle(level, isDark),
    ...overrides,
  };
}

export function getSurfaceShadowStyle(
  level: SurfaceLevel,
  isDark: boolean,
): ViewStyle {
  const shadow = surfaceTokens[isDark ? "dark" : "light"][level].shadow;

  if (!shadow) {
    return {};
  }

  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: shadow.color,
      shadowOffset: shadow.offset,
      shadowOpacity: shadow.opacity,
      shadowRadius: shadow.radius,
    },
    android: {
      shadowColor: shadow.color,
      elevation: shadow.elevation,
    },
    web: {
      boxShadow: shadow.web,
    } as ViewStyle,
    default: {
      shadowColor: shadow.color,
      shadowOffset: shadow.offset,
      shadowOpacity: shadow.opacity,
      shadowRadius: shadow.radius,
      elevation: shadow.elevation,
    },
  });
}
