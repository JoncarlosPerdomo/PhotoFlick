import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as MediaLibrary from "expo-media-library";
import { batchGetSafePhotoUrls } from "./photoUtils";
import { Asset } from "expo-media-library";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DateGroup } from "@/types";

// Query key constants
export const queryKeys = {
  photos: "photos",
  photosByDate: (date: string) => ["photos", "byDate", date],
  deletePile: "deletePile",
  photoSwipe: (dateGroup: string) => ["photos", "swipe", dateGroup],
  photoPermissions: "photoPermissions",
  photoGroups: "photoGroups",
};

// Hook to check photo permissions
export const usePhotoPermissions = () => {
  return useQuery({
    queryKey: [queryKeys.photoPermissions],
    queryFn: async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return {
        granted: status === "granted",
        status,
      };
    },
  });
};

// Hook to get photos grouped by month and year
export const usePhotoGroups = (permissionGranted: boolean) => {
  const { deletePile } = useDeletePile();

  return useQuery({
    queryKey: [queryKeys.photoGroups, deletePile.length],
    queryFn: async () => {
      // Get all photos with pagination
      let allAssets: MediaLibrary.Asset[] = [];
      let hasNextPage = true;
      let cursor: string | undefined = undefined;

      while (hasNextPage) {
        const result = await MediaLibrary.getAssetsAsync({
          mediaType: MediaLibrary.MediaType.photo,
          first: 500,
          sortBy: [MediaLibrary.SortBy.creationTime],
          after: cursor,
        });

        allAssets = [...allAssets, ...result.assets];
        hasNextPage = result.hasNextPage;
        cursor = result.endCursor;

        // Safety check to prevent infinite loops
        if (!result.assets.length) break;
      }

      const filteredAssets = allAssets.filter(
        (asset) =>
          !deletePile.some(
            (deletedPhoto: MediaLibrary.Asset) => deletedPhoto.id === asset.id,
          ),
      );

      // Group photos by month and year
      const groupedByDate = filteredAssets.reduce<
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

      return dateGroupsArray.filter((group) => group.count > 0);
    },
    enabled: permissionGranted,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });
};

// Fetch photos grouped by date
// Fetch photos for a specific date group
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

        // Process photos in smaller batches (50) for better reliability
        for (let i = 0; i < parsedPhotoIds.length; i += 50) {
          const batchIds = parsedPhotoIds.slice(i, i + 50);

          // For each batch, get all photos and filter them
          let allAssets: MediaLibrary.Asset[] = [];
          let hasNextPage = true;
          let cursor: string | undefined = undefined;

          while (hasNextPage) {
            const result = await MediaLibrary.getAssetsAsync({
              mediaType: MediaLibrary.MediaType.photo,
              first: 500,
              sortBy: [MediaLibrary.SortBy.creationTime],
              after: cursor,
            });

            allAssets = [...allAssets, ...result.assets];
            hasNextPage = result.hasNextPage;
            cursor = result.endCursor;

            // If we've found all photos in the current batch, no need to continue
            const foundAllInBatch = batchIds.every((id: string) =>
              allAssets.some((asset) => asset.id === id),
            );

            if (foundAllInBatch || !result.assets.length) break;
          }

          // Filter the assets to include only those in the current batch and exclude those in the delete pile
          const filteredAssets = allAssets.filter(
            (asset) =>
              batchIds.includes(asset.id) &&
              !deletePile.some((deletedPhoto) => deletedPhoto.id === asset.id),
          );

          // Get URLs in a batch for better performance
          const urlMap = await batchGetSafePhotoUrls(filteredAssets);

          // Create assets with display URLs
          for (const asset of filteredAssets) {
            const assetWithUrl: AssetWithDisplayUrl = {
              ...asset,
              displayUrl: urlMap.get(asset.id) || asset.uri,
            };
            photoAssets.push(assetWithUrl);
          }
        }

        // Sort by creation time (newest first)
        return photoAssets.sort((a, b) => b.creationTime - a.creationTime);
      } catch (error) {
        console.error("Error in usePhotoSwipe:", error);
        throw error;
      }
    },
    enabled: !!dateGroup && !!photoIds,
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
