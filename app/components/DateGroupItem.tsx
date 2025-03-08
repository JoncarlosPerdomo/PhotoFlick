import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Vibration,
  Animated,
} from "react-native";
import { DateGroup } from "@/types";
import { getThemeColors } from "@/context/ThemeContext";

interface DateGroupItemProps {
  item: DateGroup;
  onPress: (item: DateGroup) => void;
  onLongPress: (item: DateGroup) => void;
  isDark: boolean;
  isCompleted?: boolean;
}

const DateGroupItem: React.FC<DateGroupItemProps> = ({
  item,
  onPress,
  onLongPress,
  isDark,
  isCompleted = false,
}) => {
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

  const handleLongPress = () => {
    Vibration.vibrate(50);
    onLongPress(item);
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={[
          styles.dateGroup,
          {
            backgroundColor: colors.card,
            shadowColor: colors.shadow,
            borderColor: colors.border,
          },
          isCompleted && [
            styles.completedGroup,
            { borderColor: colors.success },
          ],
        ]}
        onPress={() => onPress(item)}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={300}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.dateText,
            { color: colors.text },
            isCompleted && [
              styles.completedText,
              { color: colors.successDark },
            ],
          ]}
        >
          {item.date}
        </Text>
        <Text
          style={[
            styles.countText,
            { color: colors.secondaryText },
            isCompleted && styles.completedText,
          ]}
        >
          {item.count} photos
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  dateGroup: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.5,
  },
  countText: {
    fontSize: 15,
    marginTop: 6,
    letterSpacing: -0.3,
  },
  completedGroup: {
    borderWidth: 1,
    opacity: 0.85,
  },
  completedText: {
    textDecorationLine: "line-through",
  },
});

export default DateGroupItem;
