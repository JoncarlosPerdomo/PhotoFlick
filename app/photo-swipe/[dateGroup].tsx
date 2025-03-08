import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as MediaLibrary from "expo-media-library";
import { getSafeImageSource } from "../../utils/photoUtils";
import { usePhotoSwipe, useDeletePile } from "../../utils/queryHooks";
import { useTheme, getThemeColors } from "../../context/ThemeContext";

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
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const { deletePile, addToDeletePile } = useDeletePile();
  const {
    data: photos = [],
    isLoading,
    isError,
    error,
    refetch,
  } = usePhotoSwipe(dateGroup, photoIds, deletePile);

  const position = useRef(new Animated.ValueXY()).current;
  const rotation = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ["-10deg", "0deg", "10deg"],
    extrapolate: "clamp",
  });

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

  const onSwipeComplete = (direction: "left" | "right") => {
    if (photos.length === 0) return;

    const photo = photos[0];

    if (direction === "left") {
      addToDeletePile(photo);
    }

    // Remove the top photo by refetching - the usePhotoSwipe hook
    // will automatically filter out photos in the delete pile
    refetch();

    position.setValue({ x: 0, y: 0 });

    if (photos.length <= 1) {
      router.back();
    }
  };

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>
            Error loading photos: {error.message}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.secondaryText }]}>
            Loading photos...
          </Text>
        </View>
      </View>
    );
  }

  if (photos.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.endOfStack,
            { backgroundColor: isDark ? "#2c2c2c" : "#f0f0f0" },
          ]}
        >
          <Text
            style={[styles.endOfStackText, { color: colors.secondaryText }]}
          >
            No more photos in this period
          </Text>
        </View>
      </View>
    );
  }

  const renderCards = () => {
    return photos
      .map((photo, index) => {
        if (index === 0) {
          return (
            <Animated.View
              key={photo.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  shadowOpacity: isDark ? 0.5 : 0.3,
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
                  backgroundColor: colors.card,
                  shadowOpacity: isDark ? 0.5 : 0.3,
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
        }
        return null;
      })
      .reverse();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.cardContainer}>{renderCards()}</View>

      <View style={styles.footer}>
        <Text style={[styles.instructions, { color: colors.text }]}>
          Swipe LEFT to DELETE, swipe RIGHT to KEEP
        </Text>
        <Text style={[styles.counter, { color: colors.secondaryText }]}>
          {photos.length} photos remaining
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
    overflow: "hidden",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
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
    borderRadius: 10,
  },
  endOfStackText: {
    fontSize: 18,
    textAlign: "center",
    padding: 20,
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  instructions: {
    fontSize: 16,
    marginBottom: 5,
  },
  counter: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    color: "#ff3b30",
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
