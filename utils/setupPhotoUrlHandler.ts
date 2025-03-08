import { Platform } from "react-native";
import * as MediaLibrary from "expo-media-library";

/**
 * This function sets up a custom URL handler for ph:// URLs on iOS.
 * It should be called early in the app lifecycle, ideally in App.tsx.
 *
 * Note: This is an experimental approach and may not work in all cases.
 * The more reliable approach is to avoid using ph:// URLs directly.
 */
export const setupPhotoUrlHandler = async () => {
  // Only needed on iOS
  if (Platform.OS !== "ios") return;

  try {
    // Request permissions first
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      console.warn("Media library permissions not granted");
      return;
    }

    // Log that we're setting up the handler
    console.log("Setting up ph:// URL handler");

    // This is a workaround to pre-load the photo library module
    // which might help with handling ph:// URLs
    const assets = await MediaLibrary.getAssetsAsync({
      first: 1,
      mediaType: MediaLibrary.MediaType.photo,
    });

    if (assets.assets.length > 0) {
      // Try to get asset info for the first photo
      // This might help initialize the photo library handlers
      await MediaLibrary.getAssetInfoAsync(assets.assets[0].id);
    }

    console.log("Photo URL handler setup complete");
  } catch (error) {
    console.error("Error setting up photo URL handler:", error);
  }
};
