import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface CategoryFilterProps {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

const PRESET_CATEGORIES = ["Personal", "Work", "Ideas", "To-Do"];

export function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  const colors = useColors();

  const allCats = Array.from(
    new Set([...PRESET_CATEGORIES, ...categories])
  );

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <TouchableOpacity
          style={[
            styles.chip,
            {
              backgroundColor:
                selected === null ? colors.primary : colors.muted,
              borderRadius: colors.radius - 2,
            },
          ]}
          onPress={() => onSelect(null)}
          activeOpacity={0.75}
        >
          <Text
            style={[
              styles.chipText,
              {
                color:
                  selected === null ? colors.primaryForeground : colors.mutedForeground,
              },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        {allCats.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.chip,
              {
                backgroundColor:
                  selected === cat ? colors.primary : colors.muted,
                borderRadius: colors.radius - 2,
              },
            ]}
            onPress={() => onSelect(selected === cat ? null : cat)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color:
                    selected === cat
                      ? colors.primaryForeground
                      : colors.mutedForeground,
                },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: "row",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
