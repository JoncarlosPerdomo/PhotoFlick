import React from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { DateGroup } from "@/types";
import { useTheme, getThemeColors } from "@/context/ThemeContext";
import {
  usePhotoPermissions,
  usePhotoGroups,
  useCompletedGroups,
} from "@/utils/queryHooks";
import LoadingIndicator from "./components/LoadingIndicator";
import ErrorView from "./components/ErrorView";
import DateGroupItem from "./components/DateGroupItem";
import DeletePileButton from "./components/DeletePileButton";
import { useDeletePile } from "@/utils/queryHooks";

export default function HomeScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const { deletePile } = useDeletePile();
  const { completedGroups, toggleGroupCompletion } = useCompletedGroups();
  const { data: permissionResult, isLoading: isLoadingPermission } =
    usePhotoPermissions();

  const {
    data: dateGroups = [],
    isLoading: isLoadingPhotos,
    isError,
    error,
    refetch,
  } = usePhotoGroups(permissionResult?.granted || false);

  const isLoading = isLoadingPermission || isLoadingPhotos;

  if (!isLoading && isError) {
    console.error("Error fetching photos:", error);
    return (
      <ErrorView
        message="Error loading photos"
        onRetry={refetch}
        isDark={isDark}
      />
    );
  }

  if (!isLoading && permissionResult && !permissionResult.granted) {
    return (
      <ErrorView
        message="This app needs access to your photo library to organize photos."
        buttonText="Grant Permission"
        onRetry={refetch}
        isDark={isDark}
      />
    );
  }

  const navigateToPhotoSwipe = (item: DateGroup) => {
    // Pass photos as serialized IDs due to Expo Router limitations with complex objects
    router.push({
      pathname: "/photo-swipe/[dateGroup]",
      params: {
        dateGroup: item.date,
        photoIds: JSON.stringify(item.photos.map((photo) => photo.id)),
      },
    });
  };

  const navigateToDeleteConfirm = () => {
    router.push("/confirm-delete");
  };

  const handleLongPress = (item: DateGroup) => {
    toggleGroupCompletion(item.date);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DeletePileButton
        count={deletePile.length}
        onPress={navigateToDeleteConfirm}
        isDark={isDark}
      />

      {isLoading ? (
        <LoadingIndicator message="Loading photo library..." isDark={isDark} />
      ) : (
        <FlatList
          data={dateGroups}
          renderItem={({ item }) => (
            <DateGroupItem
              item={item}
              onPress={navigateToPhotoSwipe}
              onLongPress={handleLongPress}
              isDark={isDark}
              isCompleted={completedGroups.includes(item.date)}
            />
          )}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
});
