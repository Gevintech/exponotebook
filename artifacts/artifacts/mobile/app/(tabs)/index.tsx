import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  LinearTransition,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryFilter } from "@/components/CategoryFilter";
import { EmptyState } from "@/components/EmptyState";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { NoteCard } from "@/components/NoteCard";
import { OnboardingModal, useOnboarding } from "@/components/OnboardingModal";
import { PremiumBadge } from "@/components/PremiumBadge";
import { PremiumModal } from "@/components/PremiumModal";
import { SearchBar } from "@/components/SearchBar";
import { useNotes } from "@/context/NotesContext";
import { useColors } from "@/hooks/useColors";
import { FREE_NOTE_LIMIT, useSubscription } from "@/lib/revenuecat";

export default function NotesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { notes, createNote, deleteNote, togglePin, getAllCategories } = useNotes();
  const { isSubscribed } = useSubscription();
  const { showOnboarding, dismissOnboarding } = useOnboarding();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPremium, setShowPremium] = useState(false);
  const [premiumReason, setPremiumReason] = useState<string | undefined>();

  const categories = getAllCategories();

  const filtered = notes.filter((n) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q);
    const matchesCat = !selectedCategory || n.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const pinnedNotes = filtered.filter((n) => n.isPinned);
  const unpinnedNotes = filtered.filter((n) => !n.isPinned);
  const hasSections = pinnedNotes.length > 0 && unpinnedNotes.length > 0;

  function handleNewNote() {
    if (!isSubscribed && notes.length >= FREE_NOTE_LIMIT) {
      setPremiumReason(
        `You've reached the ${FREE_NOTE_LIMIT}-note limit on the free plan. Upgrade to write unlimited notes.`
      );
      setShowPremium(true);
      return;
    }
    const note = createNote({
      title: "",
      content: "",
      category: selectedCategory ?? "Personal",
      isPinned: false,
      color: "default",
    });
    router.push(`/note/${note.id}` as never);
  }

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top + 8;

  const noteLimit = isSubscribed ? null : FREE_NOTE_LIMIT;
  const atLimit = noteLimit !== null && notes.length >= noteLimit;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <OnboardingModal visible={showOnboarding} onDone={dismissOnboarding} />

      <PremiumModal
        visible={showPremium}
        onClose={() => setShowPremium(false)}
        reason={premiumReason}
      />

      <View style={[styles.headerArea, { paddingTop: topPad }]}>
        <Animated.View entering={FadeInDown.springify()} style={styles.titleRow}>
          <Text style={[styles.bigTitle, { color: colors.foreground }]}>Notes</Text>
          <View style={styles.titleRight}>
            {!isSubscribed && (
              <TouchableOpacity
                onPress={() => {
                  setPremiumReason(undefined);
                  setShowPremium(true);
                }}
                activeOpacity={0.75}
              >
                <PremiumBadge size="md" />
              </TouchableOpacity>
            )}
            {isSubscribed && (
              <View style={styles.proActive}>
                <Ionicons name="sparkles" size={12} color="#FFD700" />
                <Text style={[styles.proText, { color: "#FFD700" }]}>Premium</Text>
              </View>
            )}
            <Text style={[styles.countBadge, { color: colors.mutedForeground }]}>
              {notes.length}{noteLimit ? `/${noteLimit}` : ""}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.searchRow}>
          <SearchBar value={search} onChangeText={setSearch} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </Animated.View>

        {atLimit && !search && (
          <Animated.View entering={FadeInDown.springify()}>
            <TouchableOpacity
              style={[
                styles.limitBanner,
                { backgroundColor: colors.secondary, borderColor: colors.primary + "40" },
              ]}
              onPress={() => {
                setPremiumReason(`Upgrade to write more than ${FREE_NOTE_LIMIT} notes.`);
                setShowPremium(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={14} color="#FFD700" />
              <Text style={[styles.limitText, { color: colors.primary }]}>
                Free limit reached — tap to upgrade
              </Text>
              <Feather name="chevron-right" size={14} color={colors.primary} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon={search ? "search" : "book-open"}
          title={search ? "No results" : "No notes yet"}
          subtitle={
            search
              ? "Try a different search term"
              : "Tap + to write your first note"
          }
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {hasSections ? (
            <>
              <SectionLabel label="Pinned" colors={colors} />
              {pinnedNotes.map((note, i) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  index={i}
                  onDelete={deleteNote}
                  onTogglePin={togglePin}
                />
              ))}
              <SectionLabel label="Notes" colors={colors} />
              {unpinnedNotes.map((note, i) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  index={i + pinnedNotes.length}
                  onDelete={deleteNote}
                  onTogglePin={togglePin}
                />
              ))}
            </>
          ) : (
            filtered.map((note, i) => (
              <NoteCard
                key={note.id}
                note={note}
                index={i}
                onDelete={deleteNote}
                onTogglePin={togglePin}
              />
            ))
          )}
        </ScrollView>
      )}

      <FloatingActionButton onPress={handleNewNote} />
    </View>
  );
}

function SectionLabel({
  label,
  colors,
}: {
  label: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Text style={[sectionStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
  );
}

const sectionStyles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
  },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerArea: { paddingBottom: 8, gap: 10 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  titleRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bigTitle: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  countBadge: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  proActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,215,0,0.12)",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.25)",
  },
  proText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  searchRow: { paddingHorizontal: 16 },
  listContent: { paddingBottom: 120, paddingTop: 4 },
  limitBanner: {
    marginHorizontal: 16,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
  },
  limitText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
