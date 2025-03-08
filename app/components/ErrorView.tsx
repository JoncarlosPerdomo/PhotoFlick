import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { getThemeColors } from "@/context/ThemeContext";

interface ErrorViewProps {
  message: string;
  buttonText?: string;
  onRetry: () => void;
  isDark: boolean;
}

const ErrorView: React.FC<ErrorViewProps> = ({
  message,
  buttonText = "Retry",
  onRetry,
  isDark,
}) => {
  const colors = getThemeColors(isDark);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.errorText, { color: colors.danger }]}>
        {message}
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onRetry}
      >
        <Text style={styles.buttonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default ErrorView;
