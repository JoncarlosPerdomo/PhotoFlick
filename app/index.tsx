import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { usePhotoContext } from "../context/PhotoContext";
import { DateGroup } from "../types";

export default function HomeScreen() {
  const [dateGroups, setDateGroups] = useState<DateGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { deletePile, loadDeletePile } = usePhotoContext();
  const router = useRouter();

  useEffect(() => {
    loadDeletePile();
    requestPermissionsAndLoadPhotos();
  }, []);

  const requestPermissionsAndLoadPhotos = async (): Promise<void> => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "This app needs access to your photo library to organize photos.",
          [{ text: "OK" }],
        );
        setLoading(false);
        return;
      }

      fetchPhotoDates();
    } catch (error) {
      console.error("Error requesting permissions:", error);
      setLoading(false);
    }
  };

  const fetchPhotoDates = async (): Promise<void> => {
    setLoading(true);
    try {
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

      setDateGroups(dateGroupsArray);
    } catch (error) {
      console.error("Error fetching photos:", error);
      Alert.alert("Error", "Failed to load photos. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const navigateToPhotoSwipe = (item: DateGroup) => {
    // Pass photos as serialized IDs due to Expo Router limitations with complex objects
    router.push({
      pathname: `/photo-swipe/${encodeURIComponent(item.date)}`,
      params: {
        dateGroup: item.date,
        photoIds: JSON.stringify(item.photos.map((photo) => photo.id)),
      },
    });
  };

  const renderDateGroup = ({ item }: { item: DateGroup }) => (
    <TouchableOpacity
      style={styles.dateGroup}
      onPress={() => navigateToPhotoSwipe(item)}
    >
      <Text style={styles.dateText}>{item.date}</Text>
      <Text style={styles.countText}>{item.count} photos</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {deletePile.length > 0 && (
        <TouchableOpacity
          style={styles.deletePileButton}
          onPress={() => router.push("/confirm-delete")}
        >
          <Text style={styles.deletePileText}>
            Delete Pile ({deletePile.length} photos)
          </Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading photo library...</Text>
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
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  listContainer: {
    padding: 16,
  },
  dateGroup: {
    backgroundColor: "white",
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
    color: "#777",
    marginTop: 4,
  },
  deletePileButton: {
    backgroundColor: "#ff3b30",
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
});
