import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  ListRenderItemInfo,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { usePhotoContext } from "../context/PhotoContext";
import { getSafePhotoUrl, getSafeImageSource } from "../utils/photoUtils";

// Extended Asset type that includes displayUrl
interface AssetWithDisplayUrl extends MediaLibrary.Asset {
  displayUrl?: string;
}

export default function ConfirmDeleteScreen() {
  const { deletePile, clearDeletePile } = usePhotoContext();
  const [displayPhotos, setDisplayPhotos] = useState<AssetWithDisplayUrl[]>([]);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const router = useRouter();

  // Convert deletePile photos to have display URLs
  useEffect(() => {
    const preparePhotos = async () => {
      setLoading(true);

      try {
        const photos: AssetWithDisplayUrl[] = [];

        // Process in smaller batches to avoid UI freeze
        for (let i = 0; i < deletePile.length; i += 20) {
          const batch = deletePile.slice(i, i + 20);

          // Pre-load display URLs for each photo
          for (const photo of batch) {
            try {
              // Use our utility function to get a safe URL
              const safeUrl = await getSafePhotoUrl(photo);

              photos.push({
                ...photo,
                displayUrl: safeUrl,
              });
            } catch (error) {
              console.error(
                `Error pre-loading URL for photo ${photo.id}:`,
                error,
              );
              // Still add the photo, but with an empty displayUrl
              photos.push({
                ...photo,
                displayUrl: "",
              });
            }
          }

          // Update display photos incrementally
          setDisplayPhotos([...photos]);
        }
      } catch (error) {
        console.error("Error preparing photos:", error);
      } finally {
        setLoading(false);
      }
    };

    preparePhotos();
  }, [deletePile]);

  const confirmDelete = () => {
    if (deletePile.length === 0) {
      Alert.alert("Nothing to Delete", "Your delete pile is empty.");
      return;
    }

    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete ${deletePile.length} photos? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: performDelete },
      ],
    );
  };

  const performDelete = async (): Promise<void> => {
    setDeleting(true);

    try {
      let completed = 0;
      let failed = 0;

      // Delete photos one by one
      for (const photo of deletePile) {
        try {
          // Using Expo's MediaLibrary to delete assets
          await MediaLibrary.deleteAssetsAsync([photo.id]);

          completed++;
          setProgress(completed / deletePile.length);
        } catch (error) {
          console.error(`Failed to delete photo ${photo.id}:`, error);
          failed++;
        }
      }

      clearDeletePile();

      if (failed > 0) {
        Alert.alert(
          "Deletion Partial",
          `Successfully deleted ${completed} photos. Failed to delete ${failed} photos.`,
          [{ text: "OK", onPress: () => router.replace("/") }],
        );
      } else {
        Alert.alert(
          "Deletion Complete",
          `Successfully deleted ${completed} photos.`,
          [{ text: "OK", onPress: () => router.replace("/") }],
        );
      }
    } catch (error) {
      console.error("Error during deletion:", error);
      Alert.alert("Error", "Failed to delete photos. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const renderPhoto = ({ item }: ListRenderItemInfo<AssetWithDisplayUrl>) => (
    <Image
      source={getSafeImageSource(item.displayUrl, item.uri)}
      style={styles.thumbnail}
    />
  );

  if (deleting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>
          Deleting photos... {Math.round(progress * 100)}%
        </Text>
      </View>
    );
  }

  if (loading && displayPhotos.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading photos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {deletePile.length} Photos in Delete Pile
        {loading &&
        displayPhotos.length > 0 &&
        displayPhotos.length < deletePile.length
          ? ` (Loading ${displayPhotos.length}/${deletePile.length})`
          : ""}
      </Text>

      <FlatList
        data={displayPhotos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.photoGrid}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={confirmDelete}
        >
          <Text style={styles.deleteButtonText}>Delete All</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 16,
  },
  photoGrid: {
    padding: 4,
  },
  thumbnail: {
    width: (Dimensions.get("window").width - 24) / 3,
    height: (Dimensions.get("window").width - 24) / 3,
    margin: 2,
    borderRadius: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: "#e0e0e0",
  },
  deleteButton: {
    backgroundColor: "#ff3b30",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
