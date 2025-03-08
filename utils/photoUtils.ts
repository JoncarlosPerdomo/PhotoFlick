import * as MediaLibrary from "expo-media-library";

/**
 * Safely gets a display URL for a photo asset that can be used with React Native's Image component.
 * Handles the ph:// URL issue on iOS by using localUri or other fallbacks.
 */
export const getSafePhotoUrl = async (
  asset: MediaLibrary.Asset,
): Promise<string> => {
  try {
    // Get asset info which includes URLs we can use
    const info = await MediaLibrary.getAssetInfoAsync(asset.id);

    // On iOS, prefer localUri which is a file:// URL that React Native can display
    let displayUrl = info.localUri || info.uri;

    // If we still have a ph:// URL, we need to use a different approach
    if (displayUrl.startsWith("ph://")) {
      console.log("Warning: ph:// URL detected, using fallback method");

      // Try to use filename if available
      if (info.filename) {
        // This is a fallback that might work in some cases
        displayUrl = `file:///var/mobile/Media/${info.filename}`;
      }
    }

    return displayUrl;
  } catch (error) {
    console.error("Error getting safe photo URL:", error);
    return "";
  }
};

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
