import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, SlideInRight } from "react-native-reanimated";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PremiumBadge } from "@/components/PremiumBadge";
import { PremiumModal } from "@/components/PremiumModal";
import { useNotes, type NoteColor } from "@/context/NotesContext";
import { useColors } from "@/hooks/useColors";
import { FREE_NOTE_LIMIT, useSubscription } from "@/lib/revenuecat";

const CATEGORIES = ["Personal", "Work", "Ideas", "To-Do", "Other"];

type ColorOption = { key: NoteColor; hex: string; hexDark: string; isPremium: boolean };

const COLOR_OPTIONS: ColorOption[] = [
  { key: "default", hex: "#FFFFFF", hexDark: "#1C1E1B", isPremium: false },
  { key: "green", hex: "#D1FAE5", hexDark: "#052E16", isPremium: false },
  { key: "blue", hex: "#DBEAFE", hexDark: "#1E3A5F", isPremium: false },
  { key: "yellow", hex: "#FEF3C7", hexDark: "#2D2006", isPremium: true },
  { key: "red", hex: "#FEE2E2", hexDark: "#2D0A0A", isPremium: true },
  { key: "purple", hex: "#EDE9FE", hexDark: "#1A1035", isPremium: true },
];

export default function NoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isDark = colors.background === "#111210";
  const { getNoteById, updateNote, deleteNote } = useNotes();
  const { isSubscribed } = useSubscription();

  const note = getNoteById(id ?? "");

  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [category, setCategory] = useState(note?.category ?? "Personal");
  const [noteColor, setNoteColor] = useState<NoteColor>(note?.color ?? "default");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [premiumReason, setPremiumReason] = useState<string | undefined>();
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    (t: string, c: string, cat: string, col: NoteColor) => {
      if (!id) return;
      updateNote(id, { title: t, content: c, category: cat, color: col });
    },
    [id, updateNote]
  );

  const scheduleAutoSave = useCallback(
    (t: string, c: string, cat: string, col: NoteColor) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        save(t, c, cat, col);
        setHasChanges(false);
      }, 500);
    },
    [save]
  );

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      if (id) save(title, content, category, noteColor);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  function handleDelete() {
    Alert.alert("Delete note", "This note will be permanently deleted.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          if (id) deleteNote(id);
          router.back();
        },
      },
    ]);
  }

  async function handleExport() {
    if (!isSubscribed) {
      setPremiumReason("Export notes to share or back up your writing.");
      setShowPremium(true);
      return;
    }
    const shareText = `${title}\n${"—".repeat(30)}\n${content}`;
    try {
      await Share.share({ message: shareText, title });
    } catch {
      // user cancelled
    }
  }

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom + 8;

  const currentColorOpt = COLOR_OPTIONS.find((c) => c.key === noteColor);
  const currentColorHex = isDark ? currentColorOpt?.hexDark : currentColorOpt?.hex;
  const noteBg = noteColor === "default" ? colors.background : currentColorHex ?? colors.background;

  function handleColorSelect(opt: ColorOption) {
    if (opt.isPremium && !isSubscribed) {
      setPremiumReason("Unlock all 6 note colors with Premium.");
      setShowPremium(true);
      return;
    }
    setNoteColor(opt.key);
    scheduleAutoSave(title, content, category, opt.key);
    setShowColorPicker(false);
    Haptics.selectionAsync();
  }

  return (
    <Animated.View
      entering={SlideInRight.springify().damping(20)}
      style={[styles.root, { backgroundColor: noteBg }]}
    >
      <PremiumModal
        visible={showPremium}
        onClose={() => setShowPremium(false)}
        reason={premiumReason}
      />

      <View
        style={[
          styles.navBar,
          {
            paddingTop: topPad + 8,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            save(title, content, category, noteColor);
            router.back();
          }}
          style={styles.navBtn}
          activeOpacity={0.7}
        >
          <Feather name="chevron-left" size={24} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.navActions}>
          <TouchableOpacity style={styles.navBtn} onPress={handleExport} activeOpacity={0.7}>
            <View style={styles.navBtnInner}>
              <Feather name="share" size={19} color={colors.mutedForeground} />
              {!isSubscribed && <PremiumBadge size="sm" />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => {
              setShowColorPicker((v) => !v);
              setShowCategoryPicker(false);
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.colorDot,
                {
                  backgroundColor:
                    noteColor === "default" ? colors.muted : currentColorHex,
                  borderColor: colors.border,
                },
              ]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => {
              setShowCategoryPicker((v) => !v);
              setShowColorPicker(false);
            }}
            activeOpacity={0.7}
          >
            <Feather name="tag" size={19} color={colors.mutedForeground} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtn} onPress={handleDelete} activeOpacity={0.7}>
            <Feather name="trash-2" size={19} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      {showColorPicker && (
        <Animated.View
          entering={FadeInDown.springify()}
          style={[
            styles.picker,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Text style={[styles.pickerLabel, { color: colors.mutedForeground }]}>
            Note color
          </Text>
          <View style={styles.colorRow}>
            {COLOR_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.colorSwatch,
                  {
                    backgroundColor: isDark ? opt.hexDark : opt.hex,
                    borderColor: noteColor === opt.key ? colors.primary : colors.border,
                    borderWidth: noteColor === opt.key ? 2.5 : 1,
                  },
                ]}
                onPress={() => handleColorSelect(opt)}
              >
                {opt.isPremium && !isSubscribed && (
                  <View style={styles.lockOverlay}>
                    <Ionicons name="lock-closed" size={10} color="#FFD700" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}

      {showCategoryPicker && (
        <Animated.View
          entering={FadeInDown.springify()}
          style={[
            styles.picker,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Text style={[styles.pickerLabel, { color: colors.mutedForeground }]}>
            Category
          </Text>
          <View style={styles.catRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: category === cat ? colors.primary : colors.muted,
                    borderRadius: colors.radius - 4,
                  },
                ]}
                onPress={() => {
                  setCategory(cat);
                  scheduleAutoSave(title, content, cat, noteColor);
                  setShowCategoryPicker(false);
                  Haptics.selectionAsync();
                }}
              >
                <Text
                  style={[
                    styles.catChipText,
                    {
                      color:
                        category === cat ? colors.primaryForeground : colors.mutedForeground,
                    },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 20 }]}
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <TextInput
          value={title}
          onChangeText={(t) => {
            setTitle(t);
            setHasChanges(true);
            scheduleAutoSave(t, content, category, noteColor);
          }}
          placeholder="Title"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.titleInput, { color: colors.foreground }]}
          multiline
          blurOnSubmit={false}
          returnKeyType="next"
          autoFocus={!note?.title && !note?.content}
        />

        <TextInput
          value={content}
          onChangeText={(c) => {
            setContent(c);
            setHasChanges(true);
            scheduleAutoSave(title, c, category, noteColor);
          }}
          placeholder="Start writing…"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.contentInput, { color: colors.foreground }]}
          multiline
          textAlignVertical="top"
        />
      </KeyboardAwareScrollView>

      <View
        style={[
          styles.statusBar,
          {
            borderTopColor: colors.border,
            paddingBottom: bottomPad,
          },
        ]}
      >
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: colors.secondary, borderRadius: colors.radius - 4 },
          ]}
        >
          <Text style={[styles.categoryBadgeText, { color: colors.primary }]}>{category}</Text>
        </View>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {wordCount} words · {charCount} chars
        </Text>
        {hasChanges && (
          <Animated.Text
            entering={FadeIn}
            style={[styles.saving, { color: colors.mutedForeground }]}
          >
            Saving…
          </Animated.Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBtn: { padding: 8 },
  navBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  navActions: { flexDirection: "row", alignItems: "center" },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
  },
  picker: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  pickerLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  colorRow: { flexDirection: "row", gap: 10 },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  catRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6 },
  catChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  titleInput: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
    lineHeight: 34,
    padding: 0,
  },
  contentInput: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 26,
    padding: 0,
    minHeight: 300,
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 3 },
  categoryBadgeText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  meta: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  saving: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
