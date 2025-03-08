import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useTheme, getThemeColors, ThemeMode } from "@/context/ThemeContext";

export default function SettingsScreen() {
  const { themeMode, setThemeMode, isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const themeOptions: { label: string; value: ThemeMode }[] = [
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
    { label: "System", value: "system" },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Appearance
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                {
                  borderBottomColor: colors.divider,
                  borderBottomWidth: option.value !== "system" ? 1 : 0,
                },
              ]}
              onPress={() => setThemeMode(option.value)}
            >
              <Text style={[styles.optionText, { color: colors.text }]}>
                {option.label}
              </Text>
              <View style={styles.radioButton}>
                <View
                  style={[
                    styles.radioButtonInner,
                    {
                      backgroundColor:
                        themeMode === option.value
                          ? colors.primary
                          : "transparent",
                      borderColor:
                        themeMode === option.value
                          ? colors.primary
                          : colors.secondaryText,
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.description, { color: colors.secondaryText }]}>
          Choose between light, dark, or system-based theme. System will match
          your device settings.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          About PhotoFlick
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.secondaryText }]}>
              Version
            </Text>
            <Text style={[styles.aboutValue, { color: colors.text }]}>
              1.0.0
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  optionText: {
    fontSize: 16,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  aboutLabel: {
    fontSize: 16,
  },
  aboutValue: {
    fontSize: 16,
  },
});
