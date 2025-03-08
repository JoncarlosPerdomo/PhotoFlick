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

// Color constants
const COLORS = {
  light: {
    background: "#f5f5f5",
    card: "#ffffff",
    text: "#000000",
    secondaryText: "#777777",
    border: "#e0e0e0",
    divider: "#e0e0e0",
  },
  dark: {
    background: "#121212",
    card: "#1e1e1e",
    text: "#e0e0e0",
    secondaryText: "#a0a0a0",
    border: "#2c2c2c",
    divider: "#2c2c2c",
  },
  shared: {
    primary: "#007AFF",
    danger: "#ff3b30",
    success: "#34c759",
    warning: "#ffcc00",
  },
};

const THEME_MODE_STORAGE_KEY = "photoflick_theme_mode";

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  themeMode: "system",
  setThemeMode: () => {},
  toggleTheme: () => {},
  isDark: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [theme, setTheme] = useState<"light" | "dark">(
    systemColorScheme === "dark" ? "dark" : "light",
  );

  // Load saved theme preference
  useEffect(() => {
    AsyncStorage.getItem(THEME_MODE_STORAGE_KEY)
      .then((savedMode) => {
        if (savedMode) {
          setThemeModeState(savedMode as ThemeMode);
        }
      })
      .catch((error) => {
        console.error("Failed to load theme mode:", error);
      });
  }, []);

  // Update theme when mode or system preference changes
  useEffect(() => {
    setTheme(
      themeMode === "system"
        ? systemColorScheme === "dark"
          ? "dark"
          : "light"
        : themeMode,
    );
  }, [themeMode, systemColorScheme]);

  // Save theme preference
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error("Failed to save theme mode:", error);
    }
  };

  // Toggle between light/dark modes
  const toggleTheme = () => {
    const newMode =
      themeMode === "light"
        ? "dark"
        : themeMode === "dark"
        ? "light"
        : systemColorScheme === "dark"
        ? "light"
        : "dark";

    setThemeMode(newMode);
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
  ...COLORS.shared,
  ...(isDark ? COLORS.dark : COLORS.light),
});
