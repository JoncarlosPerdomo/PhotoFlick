import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as MediaLibrary from "expo-media-library";
import { getSafePhotoUrl } from "./photoUtils";
import { Asset } from "expo-media-library";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Query key constants
export const queryKeys = {
  photos: "photos",
  photosByDate: (date: string) => ["photos", "byDate", date],
  deletePile: "deletePile",
  photoSwipe: (dateGroup: string) => ["photos", "swipe", dateGroup],
};

// Fetch photos grouped by date
export const usePhotosByDate = () => {
  return useQuery({
    queryKey: [queryKeys.photos],
    queryFn: async () => {
      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo,
        first: 1000,
        sortBy: [MediaLibrary.SortBy.creationTime],
      });

      // Group photos by date
      const photosByDate: Record<string, MediaLibrary.Asset[]> = {};

      for (const asset of assets) {
        const date = new Date(asset.creationTime * 1000)
          .toISOString()
          .split("T")[0];
        if (!photosByDate[date]) {
          photosByDate[date] = [];
        }
        photosByDate[date].push(asset);
      }

      return photosByDate;
    },
  });
};

// Fetch photos for a specific date group
export const usePhotosByDateGroup = (
  dateGroup: string,
  excludeFromDeletePile: MediaLibrary.Asset[] = [],
) => {
  return useQuery({
    queryKey: queryKeys.photosByDate(dateGroup),
    queryFn: async () => {
      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo,
        first: 1000,
        sortBy: [MediaLibrary.SortBy.creationTime],
      });

      // Filter by date and exclude photos in delete pile
      const filteredAssets = assets.filter((asset) => {
        const assetDate = new Date(asset.creationTime * 1000)
          .toISOString()
          .split("T")[0];
        const isInDeletePile = excludeFromDeletePile.some(
          (deletedPhoto) => deletedPhoto.id === asset.id,
        );

        return assetDate === dateGroup && !isInDeletePile;
      });

      // Preload safe URLs
      for (const asset of filteredAssets) {
        try {
          asset.uri = await getSafePhotoUrl(asset);
        } catch (error) {
          console.error(`Error pre-loading URL for asset ${asset.id}:`, error);
        }
      }

      return filteredAssets;
    },
    enabled: !!dateGroup,
  });
};

interface AssetWithDisplayUrl extends MediaLibrary.Asset {
  displayUrl?: string;
}

export const usePhotoSwipe = (
  dateGroup: string,
  photoIds: string,
  deletePile: Asset[],
) => {
  return useQuery({
    queryKey: queryKeys.photoSwipe(dateGroup),
    queryFn: async () => {
      try {
        if (!photoIds) {
          return [];
        }

        const parsedPhotoIds = JSON.parse(photoIds);
        const photoAssets: AssetWithDisplayUrl[] = [];

        // Load photos in batches to avoid performance issues
        for (let i = 0; i < parsedPhotoIds.length; i += 100) {
          const batch = parsedPhotoIds.slice(i, i + 100);
          const assets = await MediaLibrary.getAssetsAsync({
            mediaType: MediaLibrary.MediaType.photo,
            first: batch.length,
            sortBy: [MediaLibrary.SortBy.creationTime],
          });

          // Filter the assets to exclude those in the delete pile
          const filteredAssets = assets.assets.filter(
            (asset) =>
              batch.includes(asset.id) &&
              !deletePile.some((deletedPhoto) => deletedPhoto.id === asset.id),
          );

          // Process each asset to get a safe display URL
          for (const asset of filteredAssets) {
            const assetWithUrl: AssetWithDisplayUrl = {
              ...asset,
              displayUrl: undefined,
            };

            try {
              assetWithUrl.displayUrl = await getSafePhotoUrl(asset);
            } catch (error) {
              console.error(
                `Error pre-loading URL for asset ${asset.id}:`,
                error,
              );
            }

            photoAssets.push(assetWithUrl);
          }
        }

        return photoAssets;
      } catch (error) {
        console.error("Error loading photos:", error);
        throw error;
      }
    },
    enabled: !!photoIds && !!dateGroup,
  });
};

export const useDeletePile = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [queryKeys.deletePile],
    queryFn: async () => {
      // This would be replaced with your actual logic to load from AsyncStorage
      // For example:
      try {
        const storedPile = await AsyncStorage.getItem("deletePile");
        if (storedPile !== null) {
          return JSON.parse(storedPile);
        }
        return [];
      } catch (e) {
        console.error("Failed to load delete pile", e);
        return [];
      }
    },
  });

  // Mutation to add a photo to the delete pile
  const addToDeletePileMutation = useMutation({
    mutationFn: async (photo: MediaLibrary.Asset) => {
      try {
        const currentPile = query.data || [];

        const photoExists = currentPile.some(
          (item: MediaLibrary.Asset) => item.id === photo.id,
        );
        if (photoExists) {
          return currentPile;
        }

        const newPile = [...currentPile, photo];

        await AsyncStorage.setItem("deletePile", JSON.stringify(newPile));

        return newPile;
      } catch (e) {
        console.error("Failed to add to delete pile", e);
        throw e;
      }
    },
    onSuccess: (newPile) => {
      // Update query cache with new delete pile
      queryClient.setQueryData([queryKeys.deletePile], newPile);

      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: [queryKeys.photos] });
    },
  });

  // Mutation to remove a photo from the delete pile
  const removeFromDeletePileMutation = useMutation({
    mutationFn: async (photoId: string) => {
      try {
        const currentPile = query.data || [];

        // Remove photo from delete pile
        const newPile = currentPile.filter(
          (photo: MediaLibrary.Asset) => photo.id !== photoId,
        );

        // Save to AsyncStorage
        await AsyncStorage.setItem("deletePile", JSON.stringify(newPile));

        return newPile;
      } catch (e) {
        console.error("Failed to remove from delete pile", e);
        throw e;
      }
    },
    onSuccess: (newPile) => {
      // Update query cache with new delete pile
      queryClient.setQueryData([queryKeys.deletePile], newPile);
    },
  });

  // Mutation to clear the delete pile
  const clearDeletePileMutation = useMutation({
    mutationFn: async () => {
      try {
        // Clear from AsyncStorage
        await AsyncStorage.setItem("deletePile", JSON.stringify([]));
        return [];
      } catch (e) {
        console.error("Failed to clear delete pile", e);
        throw e;
      }
    },
    onSuccess: () => {
      // Update query cache with empty delete pile
      queryClient.setQueryData([queryKeys.deletePile], []);
    },
  });

  return {
    deletePile: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    addToDeletePile: addToDeletePileMutation.mutate,
    removeFromDeletePile: removeFromDeletePileMutation.mutate,
    clearDeletePile: clearDeletePileMutation.mutate,
  };
};

// Hook for photo deletion operations
export const usePhotoDelete = () => {
  const queryClient = useQueryClient();

  // Mutation to physically delete photos
  const deletePhotosMutation = useMutation({
    mutationFn: async (photos: MediaLibrary.Asset[]) => {
      try {
        // Get array of asset IDs to delete
        const assetIds = photos.map((photo) => photo.id);

        // Delete the photos
        const result = await MediaLibrary.deleteAssetsAsync(assetIds);

        return { success: result, deletedCount: assetIds.length };
      } catch (error) {
        console.error("Error deleting photos:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.photos] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.deletePile] });

      queryClient.setQueryData([queryKeys.deletePile], []);
    },
  });

  return {
    deletePhotos: deletePhotosMutation.mutate,
    isDeleting: deletePhotosMutation.isPending,
    deleteError: deletePhotosMutation.error,
    isDeleteSuccess: deletePhotosMutation.isSuccess,
    resetDeleteState: deletePhotosMutation.reset,
  };
};
