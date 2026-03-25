import {
  type ColorPaletteType,
  useThemeContext,
} from "@/contexts/ThemeContext";

const semanticPalettes: Record<
  ColorPaletteType,
  { success: string; warning: string; danger: string }
> = {
  // Current product defaults
  default: {
    success: "#4CD964",
    warning: "#FFCC00",
    danger: "#FF5151",
  },
  // Blue/Orange/Magenta reduces confusion for common red-green deficiencies
  deuteranopia: {
    success: "#2D9CDB",
    warning: "#F2994A",
    danger: "#C445C2",
  },
  protanopia: {
    success: "#2D9CDB",
    warning: "#F2C94C",
    danger: "#9B51E0",
  },
  tritanopia: {
    success: "#27AE60",
    warning: "#E67E22",
    danger: "#D64550",
  },
  highContrast: {
    success: "#0077FF",
    warning: "#FF8A00",
    danger: "#D40000",
  },
};

const DEFAULT_SEMANTIC = semanticPalettes.default;

// Theme-aware color values
export const themeColors = {
  // Background colors
  background: {
    light: "#ECF5FF",
    dark: {
      gradient: ["#000720", "#000746"] as [string, string],
    },
  },

  // Card backgrounds
  card: {
    light: "#FFFFFF",
    dark: "rgba(0, 4, 18, 0.9)", // #000412 at 90% opacity
  },

  // Text colors
  text: {
    primary: {
      light: "#000000",
      dark: "#FFFFFF",
    },
    secondary: {
      light: "rgba(0, 0, 0, 0.6)",
      dark: "rgba(255, 255, 255, 0.6)",
    },
    tertiary: {
      light: "rgba(0, 0, 0, 0.8)",
      dark: "rgba(255, 255, 255, 0.8)",
    },
    highlight: {
      light: "rgba(36, 58, 255, 0.7)",
      dark: "rgba(36, 58, 255, 0.7)", // Same blue for both themes
    },
  },

  // Navbar colors
  navbar: {
    light: "rgba(219, 237, 248, 0.9)",
    dark: "rgba(0, 4, 18, 0.5)",
  },

  // Modal backgrounds
  modal: {
    light: "#DBEDF8",
    dark: "rgba(0, 4, 18, 0.95)",
  },

  // Input backgrounds
  input: {
    light: "rgba(255, 255, 255, 0.75)",
    dark: "rgba(0, 0, 0, 0.6)",
  },

  // Border colors
  border: {
    light: "rgba(80, 97, 255, 0.2)",
    dark: "rgba(80, 97, 255, 0.3)",
  },
};

// Hook for accessing theme state and colors
export const useTheme = () => {
  const {
    isDark,
    theme,
    colorPalette,
    setTheme,
    setColorPalette,
    toggleTheme,
  } = useThemeContext();

  const semantic = semanticPalettes[colorPalette] ?? DEFAULT_SEMANTIC;

  return {
    isDark,
    theme,
    colorPalette,
    setTheme,
    setColorPalette,
    toggleTheme,

    // Convenience color getters
    colors: {
      background: isDark
        ? themeColors.background.dark
        : themeColors.background.light,
      card: isDark ? themeColors.card.dark : themeColors.card.light,
      text: {
        primary: isDark
          ? themeColors.text.primary.dark
          : themeColors.text.primary.light,
        secondary: isDark
          ? themeColors.text.secondary.dark
          : themeColors.text.secondary.light,
        tertiary: isDark
          ? themeColors.text.tertiary.dark
          : themeColors.text.tertiary.light,
        highlight: themeColors.text.highlight.light, // Same for both
      },
      navbar: isDark ? themeColors.navbar.dark : themeColors.navbar.light,
      modal: isDark ? themeColors.modal.dark : themeColors.modal.light,
      input: isDark ? themeColors.input.dark : themeColors.input.light,
      border: isDark ? themeColors.border.dark : themeColors.border.light,
      semantic,
    },

    // Utility functions for common patterns
    getTextColor: (
      variant: "primary" | "secondary" | "tertiary" = "primary",
    ) => {
      switch (variant) {
        case "secondary":
          return isDark
            ? themeColors.text.secondary.dark
            : themeColors.text.secondary.light;
        case "tertiary":
          return isDark
            ? themeColors.text.tertiary.dark
            : themeColors.text.tertiary.light;
        default:
          return isDark
            ? themeColors.text.primary.dark
            : themeColors.text.primary.light;
      }
    },

    getCardStyle: () => ({
      backgroundColor: isDark ? themeColors.card.dark : themeColors.card.light,
    }),

    getStatusColor: (status: "success" | "warning" | "danger") =>
      semantic[status],

    getBackgroundGradient: () =>
      isDark ? themeColors.background.dark.gradient : null,
  };
};

export default useTheme;
