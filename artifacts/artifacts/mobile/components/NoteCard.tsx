import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  GestureDetector,
  Gesture,
  Swipeable,
} from "react-native-gesture-handler";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { type Note, type NoteColor } from "@/context/NotesContext";

interface NoteCardProps {
  note: Note;
  index: number;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

const NOTE_COLORS: Record<NoteColor, { light: string; dark: string }> = {
  default: { light: "transparent", dark: "transparent" },
  green: { light: "#D1FAE5", dark: "#052E16" },
  blue: { light: "#DBEAFE", dark: "#1E3A5F" },
  yellow: { light: "#FEF3C7", dark: "#2D2006" },
  red: { light: "#FEE2E2", dark: "#2D0A0A" },
  purple: { light: "#EDE9FE", dark: "#1A1035" },
};

const NOTE_ACCENT: Record<NoteColor, string> = {
  default: "#8A8680",
  green: "#2D6A4F",
  blue: "#1D4ED8",
  yellow: "#D97706",
  red: "#DC2626",
  purple: "#7C3AED",
};

function formatDate(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getWordCount(content: string): number {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

function RightActions({
  onDelete,
  colors,
}: {
  onDelete: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      style={[styles.swipeAction, styles.deleteAction, { borderRadius: colors.radius }]}
      onPress={onDelete}
      activeOpacity={0.8}
    >
      <Feather name="trash-2" size={20} color="#fff" />
      <Text style={styles.swipeActionText}>Delete</Text>
    </TouchableOpacity>
  );
}

function LeftActions({
  isPinned,
  onTogglePin,
  colors,
}: {
  isPinned: boolean;
  onTogglePin: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      style={[styles.swipeAction, styles.pinAction, { borderRadius: colors.radius, backgroundColor: colors.secondary }]}
      onPress={onTogglePin}
      activeOpacity={0.8}
    >
      <Ionicons name={isPinned ? "pin-outline" : "pin"} size={20} color={colors.primary} />
      <Text style={[styles.swipeActionText, { color: colors.primary }]}>
        {isPinned ? "Unpin" : "Pin"}
      </Text>
    </TouchableOpacity>
  );
}

export function NoteCard({ note, index, onDelete, onTogglePin }: NoteCardProps) {
  const colors = useColors();
  const isDark = colors.background === "#111210";
  const scale = useSharedValue(1);

  const colorEntry = NOTE_COLORS[note.color];
  const accentBg = note.color !== "default"
    ? (isDark ? colorEntry.dark : colorEntry.light)
    : undefined;

  const accentColor = NOTE_ACCENT[note.color];

  const animatedCard = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.975, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 40, 300)).springify().damping(18)}
      style={styles.wrapper}
    >
      <Swipeable
        renderRightActions={() => (
          <RightActions
            onDelete={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              onDelete(note.id);
            }}
            colors={colors}
          />
        )}
        renderLeftActions={() => (
          <LeftActions
            isPinned={note.isPinned}
            onTogglePin={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onTogglePin(note.id);
            }}
            colors={colors}
          />
        )}
        overshootRight={false}
        overshootLeft={false}
        friction={2}
      >
        <Animated.View style={animatedCard}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => router.push(`/note/${note.id}` as never)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <View
              style={[
                styles.card,
                {
                  backgroundColor: accentBg ?? colors.card,
                  borderColor: note.color !== "default"
                    ? accentColor + "40"
                    : colors.border,
                  borderRadius: colors.radius,
                  borderLeftWidth: note.color !== "default" ? 3 : 1,
                  borderLeftColor: note.color !== "default" ? accentColor : colors.border,
                },
              ]}
            >
              {note.isPinned && (
                <View
                  style={[
                    styles.pinBadge,
                    { backgroundColor: colors.secondary + "CC" },
                  ]}
                >
                  <Ionicons name="pin" size={10} color={colors.primary} />
                </View>
              )}

              <View style={styles.cardInner}>
                <View style={styles.header}>
                  <Text
                    style={[styles.title, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {note.title || "Untitled"}
                  </Text>
                  <Text style={[styles.date, { color: colors.mutedForeground }]}>
                    {formatDate(note.updatedAt)}
                  </Text>
                </View>

                {note.content ? (
                  <Text
                    style={[styles.preview, { color: colors.mutedForeground }]}
                    numberOfLines={2}
                  >
                    {note.content}
                  </Text>
                ) : (
                  <Text style={[styles.emptyPreview, { color: colors.mutedForeground }]}>
                    No content
                  </Text>
                )}

                <View style={styles.footer}>
                  {note.category ? (
                    <View
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor:
                            note.color !== "default"
                              ? accentColor + "20"
                              : colors.secondary,
                          borderRadius: 99,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          {
                            color:
                              note.color !== "default" ? accentColor : colors.primary,
                          },
                        ]}
                      >
                        {note.category}
                      </Text>
                    </View>
                  ) : null}
                  <Text style={[styles.wordCount, { color: colors.mutedForeground }]}>
                    {getWordCount(note.content)} words
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Swipeable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  card: {
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardInner: {
    padding: 15,
    gap: 7,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    letterSpacing: -0.1,
  },
  date: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  preview: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  emptyPreview: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  wordCount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  pinBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  swipeAction: {
    width: 70,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    marginBottom: 10,
    marginHorizontal: 4,
  },
  deleteAction: {
    backgroundColor: "#E63946",
  },
  pinAction: {},
  swipeActionText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: "#fff",
  },
});
