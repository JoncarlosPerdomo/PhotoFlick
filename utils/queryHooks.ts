import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as MediaLibrary from "expo-media-library";
import { getSafePhotoUrl } from "./photoUtils";

// Query key constants
export const queryKeys = {
  photos: "photos",
  photosByDate: (date: string) => ["photos", "byDate", date],
  deletePile: "deletePile",
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

// Example of a mutation to add a photo to the delete pile
export const useAddToDeletePileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photo: MediaLibrary.Asset) => {
      // This would be replaced with your actual logic to add to delete pile
      // For now it's just a placeholder
      return { success: true, photo };
    },
    onSuccess: () => {
      // Invalidate relevant queries to trigger a refetch
      queryClient.invalidateQueries({ queryKey: [queryKeys.photos] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.deletePile] });
    },
  });
};
