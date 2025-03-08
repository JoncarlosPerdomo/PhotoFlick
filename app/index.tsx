import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { DateGroup } from "../types";
import { useQuery } from "@tanstack/react-query";
import { useDeletePile } from "../utils/queryHooks";
import * as MediaLibrary from "expo-media-library";
import { useTheme, getThemeColors } from "../context/ThemeContext";

const usePhotoPermissions = () => {
  return useQuery({
    queryKey: ["photoPermissions"],
    queryFn: async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return {
        granted: status === "granted",
        status,
      };
    },
  });
};

const usePhotoGroups = (permissionGranted: boolean) => {
  return useQuery({
    queryKey: ["photoGroups"],
    queryFn: async () => {
      // Get all photos
      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo,
        first: 10000, // Adjust based on performance needs
        sortBy: [MediaLibrary.SortBy.creationTime],
      });

      // Group photos by month and year
      const groupedByDate = assets.assets.reduce<
        Record<string, MediaLibrary.Asset[]>
      >((groups, photo) => {
        const date = new Date(photo.creationTime);
        const monthYear = `${date.toLocaleString("default", {
          month: "long",
        })} ${date.getFullYear()}`;

        if (!groups[monthYear]) {
          groups[monthYear] = [];
        }

        groups[monthYear].push(photo);
        return groups;
      }, {});

      // Convert to array format for FlatList
      const dateGroupsArray: DateGroup[] = Object.keys(groupedByDate).map(
        (date) => ({
          date,
          count: groupedByDate[date].length,
          photos: groupedByDate[date],
        }),
      );

      // Sort by date (most recent first)
      dateGroupsArray.sort((a, b) => {
        const dateA = new Date(a.photos[0].creationTime);
        const dateB = new Date(b.photos[0].creationTime);
        return dateB.getTime() - dateA.getTime();
      });

      return dateGroupsArray;
    },
    enabled: permissionGranted === true,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });
};

export default function HomeScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const { deletePile } = useDeletePile();
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
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.errorText, { color: colors.danger }]}>
          Error loading photos
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isLoading && permissionResult && !permissionResult.granted) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.errorText, { color: colors.danger }]}>
          This app needs access to your photo library to organize photos.
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <Text style={styles.retryButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
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

  const renderDateGroup = ({ item }: { item: DateGroup }) => (
    <TouchableOpacity
      style={[styles.dateGroup, { backgroundColor: colors.card }]}
      onPress={() => navigateToPhotoSwipe(item)}
    >
      <Text style={[styles.dateText, { color: colors.text }]}>{item.date}</Text>
      <Text style={[styles.countText, { color: colors.secondaryText }]}>
        {item.count} photos
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {deletePile.length > 0 && (
        <TouchableOpacity
          style={[styles.deletePileButton, { backgroundColor: colors.danger }]}
          onPress={() => router.push("/confirm-delete")}
        >
          <Text style={styles.deletePileText}>
            Delete Pile ({deletePile.length} photos)
          </Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.secondaryText }]}>
            Loading photo library...
          </Text>
        </View>
      ) : (
        <FlatList
          data={dateGroups}
          renderItem={renderDateGroup}
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
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  dateGroup: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  countText: {
    fontSize: 14,
    marginTop: 4,
  },
  deletePileButton: {
    padding: 12,
    margin: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  deletePileText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
