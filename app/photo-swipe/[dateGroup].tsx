// app/photo-swipe/[dateGroup].tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as MediaLibrary from "expo-media-library";
import { usePhotoContext } from "../../context/PhotoContext";
import { getSafePhotoUrl, getSafeImageSource } from "../../utils/photoUtils";

// Extended Asset type that includes displayUrl
interface AssetWithDisplayUrl extends MediaLibrary.Asset {
  displayUrl?: string;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface PhotoSwipeParams {
  dateGroup: string;
  photoIds: string;
}

export default function PhotoSwipeScreen() {
  const params = useLocalSearchParams();
  const dateGroup = params.dateGroup as string;
  const photoIds = params.photoIds as string;

  const [photos, setPhotos] = useState<AssetWithDisplayUrl[]>([]);
  const [remainingPhotos, setRemainingPhotos] = useState<AssetWithDisplayUrl[]>(
    [],
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingImage, setLoadingImage] = useState<boolean>(false);
  const { addToDeletePile, saveDeletePile } = usePhotoContext();
  const router = useRouter();

  const position = useRef(new Animated.ValueXY()).current;
  const rotation = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ["-10deg", "0deg", "10deg"],
    extrapolate: "clamp",
  });

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        if (!photoIds) {
          setLoading(false);
          return;
        }

        const parsedPhotoIds = JSON.parse(photoIds);
        const photoAssets: AssetWithDisplayUrl[] = [];

        // Load photos in batches to avoid performance issues
        for (let i = 0; i < parsedPhotoIds.length; i += 100) {
          const batch = parsedPhotoIds.slice(i, i + 100);
          const assets = await MediaLibrary.getAssetsAsync({
            mediaType: MediaLibrary.MediaType.photo,
            first: batch.length,
            // Use a filter to get only the assets with IDs in our batch
            // since assetIds is not a valid property
            sortBy: [MediaLibrary.SortBy.creationTime],
          });

          // Filter the assets to only include those in our batch
          const filteredAssets = assets.assets.filter((asset) =>
            batch.includes(asset.id),
          );

          // Process each asset to get a safe display URL
          for (const asset of filteredAssets) {
            const assetWithUrl: AssetWithDisplayUrl = {
              ...asset,
              displayUrl: undefined,
            };

            // Pre-load the display URL to avoid ph:// URL issues later
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

        setPhotos(photoAssets);
        setRemainingPhotos(photoAssets);
        setLoading(false);
      } catch (error) {
        console.error("Error loading photos:", error);
        setLoading(false);
      }
    };

    loadPhotos();
  }, [photoIds]);

  // This function gets a proper display URL for an asset
  const getDisplayUrl = async (asset: AssetWithDisplayUrl): Promise<string> => {
    if (asset.displayUrl) {
      return asset.displayUrl;
    }

    try {
      // Use our utility function to get a safe URL
      const safeUrl = await getSafePhotoUrl(asset);

      // Cache the display URL
      asset.displayUrl = safeUrl;

      return safeUrl;
    } catch (error) {
      console.error("Error getting asset info:", error);
      return "";
    }
  };

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const dislikeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const nextCardOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [1, 0.8, 1],
    extrapolate: "clamp",
  });

  const nextCardScale = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [1, 0.95, 1],
    extrapolate: "clamp",
  });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy });
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > SWIPE_THRESHOLD) {
        swipeRight();
      } else if (gesture.dx < -SWIPE_THRESHOLD) {
        swipeLeft();
      } else {
        resetPosition();
      }
    },
  });

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      useNativeDriver: false,
    }).start();
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH * 1.5, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => onSwipeComplete("left"));
  };

  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH * 1.5, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => onSwipeComplete("right"));
  };

  const onSwipeComplete = async (direction: "left" | "right") => {
    if (remainingPhotos.length === 0) return;

    const photo = remainingPhotos[0];

    // If swiped left, add to delete pile
    if (direction === "left") {
      addToDeletePile(photo);
      await saveDeletePile();
    }

    // Remove the top card
    const newRemainingPhotos = remainingPhotos.slice(1);
    setRemainingPhotos(newRemainingPhotos);

    // Reset position for the next card
    position.setValue({ x: 0, y: 0 });

    // If no more photos, go back
    if (newRemainingPhotos.length === 0) {
      router.back();
    }
  };

  // Load display URLs for the top two cards
  useEffect(() => {
    const loadTopImagesUrls = async () => {
      if (remainingPhotos.length === 0 || loading) return;

      setLoadingImage(true);

      try {
        // Load display URLs for the top two cards (or just one if that's all we have)
        const topPhotos = remainingPhotos.slice(
          0,
          Math.min(2, remainingPhotos.length),
        );

        for (const photo of topPhotos) {
          if (!photo.displayUrl) {
            photo.displayUrl = await getDisplayUrl(photo);
          }
        }

        // Force a re-render
        setRemainingPhotos([...remainingPhotos]);
      } catch (error) {
        console.error("Error loading display URLs:", error);
      } finally {
        setLoadingImage(false);
      }
    };

    loadTopImagesUrls();
  }, [remainingPhotos, loading]);

  const renderCards = () => {
    if (loading) {
      return (
        <View style={styles.endOfStack}>
          <Text style={styles.endOfStackText}>Loading photos...</Text>
        </View>
      );
    }

    if (remainingPhotos.length === 0) {
      return (
        <View style={styles.endOfStack}>
          <Text style={styles.endOfStackText}>
            No more photos in this period
          </Text>
        </View>
      );
    }

    return remainingPhotos
      .map((photo, index) => {
        if (index === 0) {
          // Show loading indicator if we're still getting the display URL
          if (loadingImage && !photo.displayUrl) {
            return (
              <View key={photo.id} style={[styles.card, styles.loadingCard]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading photo...</Text>
              </View>
            );
          }

          return (
            <Animated.View
              key={photo.id}
              style={[
                styles.card,
                {
                  transform: [
                    { translateX: position.x },
                    { translateY: position.y },
                    { rotate: rotation },
                  ],
                },
              ]}
              {...panResponder.panHandlers}
            >
              <Image
                source={getSafeImageSource(photo.displayUrl, photo.uri)}
                style={styles.image}
                resizeMode="cover"
              />

              <Animated.View
                style={[
                  styles.overlay,
                  styles.keepOverlay,
                  { opacity: likeOpacity },
                ]}
              >
                <Text style={styles.overlayText}>KEEP</Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.overlay,
                  styles.deleteOverlay,
                  { opacity: dislikeOpacity },
                ]}
              >
                <Text style={styles.overlayText}>DELETE</Text>
              </Animated.View>
            </Animated.View>
          );
        } else if (index === 1) {
          return (
            <Animated.View
              key={photo.id}
              style={[
                styles.card,
                {
                  opacity: nextCardOpacity,
                  transform: [{ scale: nextCardScale }],
                },
              ]}
            >
              <Image
                source={getSafeImageSource(photo.displayUrl, photo.uri)}
                style={styles.image}
                resizeMode="cover"
              />
            </Animated.View>
          );
        } else {
          return null;
        }
      })
      .reverse();
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>{renderCards()}</View>

      <View style={styles.footer}>
        <Text style={styles.instructions}>
          Swipe LEFT to DELETE, swipe RIGHT to KEEP
        </Text>
        <Text style={styles.counter}>
          {remainingPhotos.length} photos remaining
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  card: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_WIDTH * 1.2,
    borderRadius: 10,
    position: "absolute",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    overflow: "hidden",
  },
  loadingCard: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  overlay: {
    position: "absolute",
    top: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 3,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  keepOverlay: {
    right: 20,
    borderColor: "#4CD964",
  },
  deleteOverlay: {
    left: 20,
    borderColor: "#FF3B30",
  },
  overlayText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  endOfStack: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_WIDTH * 1.2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
  },
  endOfStackText: {
    fontSize: 18,
    color: "#888",
    textAlign: "center",
    padding: 20,
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  instructions: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  counter: {
    fontSize: 14,
    color: "#888",
  },
});
