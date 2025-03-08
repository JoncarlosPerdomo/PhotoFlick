import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
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

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.message, { color: colors.secondaryText }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  message: {
    marginTop: 10,
    fontSize: 16,
  },
});

export default LoadingIndicator;
