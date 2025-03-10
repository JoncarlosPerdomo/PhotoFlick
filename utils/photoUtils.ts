import * as MediaLibrary from "expo-media-library";

// Cache for storing safe photo URLs
const photoUrlCache = new Map<string, string>();

/**
 * Gets a safe photo URL that works across different platforms
 * @param photo The photo asset to get the URL for
 * @returns A promise resolving to the safe URL
 */
export const getSafePhotoUrl = async (
  photo: MediaLibrary.Asset,
): Promise<string> => {
  // Return cached URL if available
  if (photoUrlCache.has(photo.id)) {
    return photoUrlCache.get(photo.id)!;
  }

  // Generate and cache a new URL
  try {
    const asset = await MediaLibrary.getAssetInfoAsync(photo.id);
    const safeUrl = asset.localUri || photo.uri;

    if (safeUrl) {
      photoUrlCache.set(photo.id, safeUrl);
      return safeUrl;
    }

    throw new Error("Failed to get safe photo URL");
  } catch (error) {
    console.error(`Error getting safe URL for photo ${photo.id}:`, error);
    // Fallback to original URI
    photoUrlCache.set(photo.id, photo.uri);
    return photo.uri;
  }
};
/**
 * Batch process multiple photos to get their safe URLs
 * @param photos Array of photo assets
 * @returns Promise resolving to a map of photo IDs to safe URLs
 */
export const batchGetSafePhotoUrls = async (
  photos: MediaLibrary.Asset[],
): Promise<Map<string, string>> => {
  const urlMap = new Map<string, string>();

  // Process in batches of 10 to avoid overwhelming the system
  const batchSize = 10;
  for (let i = 0; i < photos.length; i += batchSize) {
    const batch = photos.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (photo) => {
        try {
          const url = await getSafePhotoUrl(photo);
          urlMap.set(photo.id, url);
        } catch (error) {
          console.error(
            `Error in batch processing for photo ${photo.id}:`,
            error,
          );
          // Fall back to original URI
          urlMap.set(photo.id, photo.uri);
        }
      }),
    );
  }

  return urlMap;
};

// Export the cache for potential reuse
/**
 * Checks if a URL is safe to use with React Native's Image component.
 * Specifically, it checks if the URL is not a ph:// URL.
 */
export const isSafeImageUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  return !url.startsWith("ph://");
};

/**
 * Gets a source object for React Native's Image component that safely handles ph:// URLs.
 * Falls back to a placeholder image if no safe URL is available.
 */
export const getSafeImageSource = (
  displayUrl?: string,
  originalUri?: string,
  placeholderImagePath: any = require("../assets/images/icon.png"),
) => {
  if (displayUrl && isSafeImageUrl(displayUrl)) {
    return { uri: displayUrl };
  }

  if (originalUri && isSafeImageUrl(originalUri)) {
    return { uri: originalUri };
  }

  return placeholderImagePath;
};
