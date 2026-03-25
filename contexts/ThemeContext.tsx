import AsyncStorage from "@react-native-async-storage/async-storage";
import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

type ThemeType = "light" | "dark";
export type ColorPaletteType =
  | "default"
  | "deuteranopia"
  | "protanopia"
  | "tritanopia"
  | "highContrast";

interface ThemeContextType {
  isDark: boolean;
  theme: ThemeType;
  colorPalette: ColorPaletteType;
  setTheme: (theme: ThemeType) => void;
  setColorPalette: (palette: ColorPaletteType) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = "@aide_theme";
const COLOR_PALETTE_STORAGE_KEY = "@aide_color_palette";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [theme, setThemeState] = useState<ThemeType>("light");
  const [colorPalette, setColorPaletteState] =
    useState<ColorPaletteType>("default");
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme and color palette on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [savedTheme, savedPalette] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(COLOR_PALETTE_STORAGE_KEY),
        ]);

        if (savedTheme === "dark" || savedTheme === "light") {
          setThemeState(savedTheme);
        }

        if (
          savedPalette === "default" ||
          savedPalette === "deuteranopia" ||
          savedPalette === "protanopia" ||
          savedPalette === "tritanopia" ||
          savedPalette === "highContrast"
        ) {
          setColorPaletteState(savedPalette);
        }
      } catch (error) {
        console.error("Error loading theme preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPreferences();
  }, []);

  const setTheme = async (newTheme: ThemeType) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const setColorPalette = async (newPalette: ColorPaletteType) => {
    try {
      await AsyncStorage.setItem(COLOR_PALETTE_STORAGE_KEY, newPalette);
      setColorPaletteState(newPalette);
    } catch (error) {
      console.error("Error saving color palette:", error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  // Don't render children until theme is loaded
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        isDark: theme === "dark",
        theme,
        colorPalette,
        setTheme,
        setColorPalette,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeContext;
