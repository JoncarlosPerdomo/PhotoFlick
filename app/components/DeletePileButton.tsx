import React from "react";
import { TouchableOpacity, Text, StyleSheet, Animated } from "react-native";
import { getThemeColors } from "@/context/ThemeContext";

interface DeletePileButtonProps {
  count: number;
  onPress: () => void;
  isDark: boolean;
}

const DeletePileButton: React.FC<DeletePileButtonProps> = ({
  count,
  onPress,
  isDark,
}) => {
  if (count <= 0) return null;

  const colors = getThemeColors(isDark);
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: colors.danger,
            shadowColor: colors.shadow,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <Text style={styles.text}>Delete Pile ({count} photos)</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 60,
  },
  button: {
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    height: 44,
  },
  text: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    letterSpacing: -0.3,
  },
});

export default DeletePileButton;
