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
  const router = useRouter();

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
          headerTitleStyle: {
            fontWeight: "600",
            fontSize: 18,
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
          animation: "slide_from_right",
          animationDuration: 200,
          headerBackTitleStyle: {
            fontSize: 16,
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
            presentation: "card",
          })}
        />
        <Stack.Screen
          name="confirm-delete"
          options={{
            title: "Confirm Deletion",
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: "Settings",
            presentation: "card",
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
