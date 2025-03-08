import { Stack } from "expo-router";
import { PhotoProvider } from "../context/PhotoContext";
import { useEffect } from "react";
import { setupPhotoUrlHandler } from "../utils/setupPhotoUrlHandler";

export default function Layout() {
  // Set up the photo URL handler when the app starts
  useEffect(() => {
    setupPhotoUrlHandler();
  }, []);

  return (
    <PhotoProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: "Photo Organizer" }} />
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
      </Stack>
    </PhotoProvider>
  );
}
