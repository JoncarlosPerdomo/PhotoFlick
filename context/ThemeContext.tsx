import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: "light" | "dark";
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  themeMode: "system",
  setThemeMode: () => {},
  toggleTheme: () => {},
  isDark: false,
});

const THEME_MODE_STORAGE_KEY = "photoflick_theme_mode";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();

  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");

  const [theme, setTheme] = useState<"light" | "dark">(
    systemColorScheme === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem(
          THEME_MODE_STORAGE_KEY,
        );
        if (savedThemeMode) {
          setThemeModeState(savedThemeMode as ThemeMode);
        }
      } catch (error) {
        console.error("Failed to load theme mode:", error);
      }
    };

    loadThemeMode();
  }, []);

  useEffect(() => {
    if (themeMode === "system") {
      setTheme(systemColorScheme === "dark" ? "dark" : "light");
    } else {
      setTheme(themeMode);
    }
  }, [themeMode, systemColorScheme]);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error("Failed to save theme mode:", error);
    }
  };

  const toggleTheme = () => {
    if (themeMode === "light") {
      setThemeMode("dark");
    } else if (themeMode === "dark") {
      setThemeMode("light");
    } else {
      setThemeMode(systemColorScheme === "dark" ? "light" : "dark");
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        setThemeMode,
        toggleTheme,
        isDark: theme === "dark",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export const getThemeColors = (isDark: boolean) => ({
  background: isDark ? "#121212" : "#f5f5f5",
  card: isDark ? "#1e1e1e" : "#ffffff",
  text: isDark ? "#e0e0e0" : "#000000",
  secondaryText: isDark ? "#a0a0a0" : "#777777",
  primary: "#007AFF",
  danger: "#ff3b30",
  success: "#34c759",
  warning: "#ffcc00",

  border: isDark ? "#2c2c2c" : "#e0e0e0",
  divider: isDark ? "#2c2c2c" : "#e0e0e0",
});
