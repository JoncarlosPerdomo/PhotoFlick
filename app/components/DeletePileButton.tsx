import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { getThemeColors } from "../../context/ThemeContext";

interface DeletePileButtonProps {
  count: number;
  onPress: () => void;
  isDark: boolean;
}

export const DeletePileButton: React.FC<DeletePileButtonProps> = ({
  count,
  onPress,
  isDark,
}) => {
  if (count <= 0) return null;

  const colors = getThemeColors(isDark);

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.danger }]}
      onPress={onPress}
    >
      <Text style={styles.text}>Delete Pile ({count} photos)</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 12,
    margin: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  text: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
