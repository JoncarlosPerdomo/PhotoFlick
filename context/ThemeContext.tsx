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
    background: "#F8F9FA",
    card: "#FFFFFF",
    text: "#1A1A1A",
    secondaryText: "#6C757D",
    border: "#DEE2E6",
    divider: "#E9ECEF",
    subtle: "#F1F3F5",
    accent: "#E7F5FF",
    highlight: "#F8F9FA",
    shadow: "rgba(0, 0, 0, 0.1)",
  },
  dark: {
    background: "#121212",
    card: "#1E1E1E",
    text: "#E9ECEF",
    secondaryText: "#ADB5BD",
    border: "#2C2C2C",
    divider: "#2C2C2C",
    subtle: "#252525",
    accent: "#1A365D",
    highlight: "#2C2C2C",
    shadow: "rgba(0, 0, 0, 0.3)",
  },
  shared: {
    primary: "#228BE6",
    primaryDark: "#1971C2",
    primaryLight: "#74C0FC",
    danger: "#FA5252",
    dangerDark: "#E03131",
    dangerLight: "#FFB5B5",
    success: "#40C057",
    successDark: "#2F9E44",
    successLight: "#8CE99A",
    warning: "#FCC419",
    warningDark: "#F08C00",
    warningLight: "#FFE066",
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
