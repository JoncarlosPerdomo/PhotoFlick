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
import { useTheme, getThemeColors } from "../context/ThemeContext";

interface AssetWithDisplayUrl extends MediaLibrary.Asset {
  displayUrl?: string;
}

export default function ConfirmDeleteScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<number>(0);
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

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
    <View
      style={[
        styles.photoContainer,
        { backgroundColor: isDark ? "#333" : "#e0e0e0" },
      ]}
    >
      <Image
        source={getSafeImageSource(item.displayUrl, item.uri)}
        style={styles.photo}
        resizeMode="cover"
      />
    </View>
  );

  if (isLoadingDeletePile) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.secondaryText }]}>
          Loading photos...
        </Text>
      </View>
    );
  }

  if (isDeleting) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color="#FF3B30" />
        <Text style={styles.deletingText}>Deleting photos...</Text>
        {progress > 0 && (
          <Text style={[styles.progressText, { color: colors.secondaryText }]}>
            {Math.round(progress * 100)}% complete
          </Text>
        )}
      </View>
    );
  }

  if (deletePile.length === 0) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
          No photos in delete pile
        </Text>
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: isDark ? "#333" : "#e0e0e0",
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Delete Pile</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
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

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.card,
            borderTopColor: isDark ? "#333" : "#e0e0e0",
          },
        ]}
      >
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearSelection}
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.cancelButton,
            {
              backgroundColor: isDark ? "#444" : "#e0e0e0",
            },
          ]}
          onPress={() => router.back()}
        >
          <Text
            style={[
              styles.cancelButtonText,
              {
                color: isDark ? "#e0e0e0" : "#333",
              },
            ]}
          >
            Cancel
          </Text>
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
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  photoGrid: {
    padding: 8,
  },
  photoContainer: {
    margin: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  photo: {
    width: photoSize,
    height: photoSize,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
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
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "bold",
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
  },
  deletingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#FF3B30",
  },
  progressText: {
    marginTop: 5,
    fontSize: 14,
  },
  emptyText: {
    fontSize: 18,
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
