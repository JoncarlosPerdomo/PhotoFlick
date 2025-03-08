import { Stack } from "expo-router";
import { QueryClientProvider } from "@/context/QueryClientProvider";
import {
  ThemeProvider,
  useTheme,
  getThemeColors,
} from "@/context/ThemeContext";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

function AppContent() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
    useRouter();
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
