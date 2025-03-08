import React, { useState } from "react";
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
import { getSafeImageSource } from "../utils/photoUtils";
import { useDeletePile, usePhotoDelete } from "../utils/queryHooks";

interface AssetWithDisplayUrl extends MediaLibrary.Asset {
  displayUrl?: string;
}

export default function ConfirmDeleteScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<number>(0);

  const {
    deletePile,
    isLoading: isLoadingDeletePile,
    clearDeletePile,
  } = useDeletePile();
  const {
    deletePhotos,
    isDeleting,
    deleteError,
    isDeleteSuccess,
    resetDeleteState,
  } = usePhotoDelete();

  const confirmDelete = () => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete ${deletePile.length} photos?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: performDelete,
        },
      ],
    );
  };

  const performDelete = async (): Promise<void> => {
    if (deletePile.length === 0) {
      Alert.alert("No Photos", "There are no photos to delete.");
      return;
    }

    try {
      await deletePhotos(deletePile);

      clearDeletePile();

      Alert.alert("Success", `${deletePile.length} photos have been deleted.`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error deleting photos:", error);
      Alert.alert("Error", "Failed to delete some photos. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  const handleClearSelection = () => {
    Alert.alert(
      "Clear Selection",
      "Are you sure you want to clear your selection? This will not delete any photos.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          onPress: () => {
            clearDeletePile();
            router.back();
          },
        },
      ],
    );
  };

  const renderPhoto = ({ item }: ListRenderItemInfo<AssetWithDisplayUrl>) => (
    <View style={styles.photoContainer}>
      <Image
        source={getSafeImageSource(item.displayUrl, item.uri)}
        style={styles.photo}
        resizeMode="cover"
      />
    </View>
  );

  if (isLoadingDeletePile) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading photos...</Text>
      </View>
    );
  }

  if (isDeleting) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FF3B30" />
        <Text style={styles.deletingText}>Deleting photos...</Text>
        {progress > 0 && (
          <Text style={styles.progressText}>
            {Math.round(progress * 100)}% complete
          </Text>
        )}
      </View>
    );
  }

  if (deletePile.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.emptyText}>No photos in delete pile</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Delete Pile</Text>
        <Text style={styles.subtitle}>
          {deletePile.length} photo{deletePile.length !== 1 ? "s" : ""} selected
          for deletion
        </Text>
      </View>

      <FlatList
        data={deletePile as AssetWithDisplayUrl[]}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.photoGrid}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearSelection}
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
          <Text style={styles.deleteButtonText}>Delete All</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const { width } = Dimensions.get("window");
const photoSize = width / 3 - 12;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "white",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  photoGrid: {
    padding: 8,
  },
  photoContainer: {
    margin: 4,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#e0e0e0",
  },
  photo: {
    width: photoSize,
    height: photoSize,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "white",
  },
  clearButton: {
    flex: 1,
    backgroundColor: "#4F86C6",
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  deletingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#FF3B30",
  },
  progressText: {
    marginTop: 5,
    fontSize: 14,
    color: "#666",
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    width: 150,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
});
