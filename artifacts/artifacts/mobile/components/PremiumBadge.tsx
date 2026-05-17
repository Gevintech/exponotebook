import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

interface PremiumBadgeProps {
  size?: "sm" | "md";
}

export function PremiumBadge({ size = "sm" }: PremiumBadgeProps) {
  const isSmall = size === "sm";
  return (
    <Animated.View entering={ZoomIn.springify()} style={[styles.badge, isSmall && styles.small]}>
      <Ionicons name="sparkles" size={isSmall ? 9 : 12} color="#FFD700" />
      {!isSmall && <Text style={styles.label}>PRO</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.35)",
    gap: 3,
  },
  small: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  label: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#FFD700",
    letterSpacing: 0.5,
  },
});
