import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/components/EmptyState";
import { NoteCard } from "@/components/NoteCard";
import { SearchBar } from "@/components/SearchBar";
import { useNotes } from "@/context/NotesContext";
import { useColors } from "@/hooks/useColors";

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { searchNotes, deleteNote, togglePin } = useNotes();
  const [query, setQuery] = useState("");

  const results = query.trim() ? searchNotes(query) : [];

  const topPad =
    Platform.OS === "web"
      ? insets.top + 67
      : insets.top + 8;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Search</Text>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search all notes…"
          autoFocus={false}
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        scrollEnabled={!!results.length}
        contentContainerStyle={
          results.length === 0 ? styles.emptyFlex : styles.list
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={query.trim() ? "search" : "search"}
            title={query.trim() ? "No results found" : "Search your notes"}
            subtitle={
              query.trim()
                ? `No notes matching "${query}"`
                : "Type to find notes by title or content"
            }
          />
        }
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            onDelete={deleteNote}
            onTogglePin={togglePin}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  list: {
    paddingBottom: 80,
    paddingTop: 4,
  },
  emptyFlex: {
    flexGrow: 1,
  },
});
