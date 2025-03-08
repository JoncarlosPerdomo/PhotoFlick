import React, { useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from "react-native";
import { getThemeColors } from "@/context/ThemeContext";

interface LoadingIndicatorProps {
  message?: string;
  isDark: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = "Loading...",
  isDark,
}) => {
  const colors = getThemeColors(isDark);
  const opacity = React.useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const pulseAnimation = Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.6,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulseAnimation).start();

    return () => {
      opacity.setValue(0.6);
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.spinner}
        />
        <Animated.Text
          style={[
            styles.message,
            {
              color: colors.secondaryText,
              opacity,
            },
          ]}
        >
          {message}
        </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    padding: 24,
  },
  spinner: {
    marginBottom: 16,
    transform: [{ scale: 1.2 }],
  },
  message: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: -0.3,
  },
});

export default LoadingIndicator;
