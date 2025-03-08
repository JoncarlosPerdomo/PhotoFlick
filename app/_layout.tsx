import { Stack } from "expo-router";
import { useEffect } from "react";
import { QueryClientProvider } from "../context/QueryClientProvider";
import {
  ThemeProvider,
  useTheme,
  getThemeColors,
} from "../context/ThemeContext";
import { StatusBar } from "expo-status-bar";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

function AppContent() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const router = useRouter();

  const navigateToSettings = () => {
    router.push("/settings");
  };

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
          headerShadowVisible: !isDark,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Photo Flicker",
            headerRight: () => (
              <TouchableOpacity
                onPress={navigateToSettings}
                style={{ marginRight: 16 }}
              >
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen
          name="photo-swipe/[dateGroup]"
          options={({ route }) => ({
            title: (route.params as { dateGroup: string }).dateGroup,
            headerBackTitle: "Back",
          })}
        />
        <Stack.Screen
          name="confirm-delete"
          options={{ title: "Confirm Deletion" }}
        />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
      </Stack>
    </>
  );
}

export default function Layout() {
  return (
    <QueryClientProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
