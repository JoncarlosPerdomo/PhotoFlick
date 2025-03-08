import React from "react";
import { TouchableOpacity, Text, StyleSheet, Vibration } from "react-native";
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

  const handleLongPress = () => {
    Vibration.vibrate(50); // Short vibration for feedback
    onLongPress(item);
  };

  return (
    <TouchableOpacity
      style={[
        styles.dateGroup,
        { backgroundColor: colors.card },
        isCompleted && styles.completedGroup,
      ]}
      onPress={() => onPress(item)}
      onLongPress={handleLongPress}
      delayLongPress={300}
    >
      <Text
        style={[
          styles.dateText,
          { color: colors.text },
          isCompleted && styles.completedText,
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
  );
};

const styles = StyleSheet.create({
  dateGroup: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  countText: {
    fontSize: 14,
    marginTop: 4,
  },
  completedGroup: {
    opacity: 0.7,
  },
  completedText: {
    textDecorationLine: "line-through",
  },
});

export default DateGroupItem;
