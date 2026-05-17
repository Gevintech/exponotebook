import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type NoteColor =
  | "default"
  | "green"
  | "blue"
  | "yellow"
  | "red"
  | "purple";

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  color: NoteColor;
  createdAt: number;
  updatedAt: number;
}

export type SortOption = "updatedAt" | "createdAt" | "title";

interface NotesContextType {
  notes: Note[];
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  createNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePin: (id: string) => void;
  getNoteById: (id: string) => Note | undefined;
  searchNotes: (query: string) => Note[];
  getAllCategories: () => string[];
}

const STORAGE_KEY = "@notebook_notes";
const SORT_KEY = "@notebook_sort";

const NotesContext = createContext<NotesContextType | null>(null);

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

const SAMPLE_NOTES: Note[] = [
  {
    id: generateId(),
    title: "Welcome to Notebook",
    content:
      "This is your personal space for thoughts, ideas, and everything in between.\n\nSwipe left on a note to delete it, or swipe right to pin it to the top.\n\nTap the + button to create a new note.",
    category: "Personal",
    isPinned: true,
    color: "green",
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: generateId(),
    title: "Meeting notes",
    content:
      "Q2 planning session\n\n- Review OKRs\n- Budget allocation\n- Team capacity\n- Roadmap alignment",
    category: "Work",
    isPinned: false,
    color: "blue",
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: generateId(),
    title: "App idea",
    content:
      "A habit tracker that uses streaks and gentle reminders. Could integrate with health data.",
    category: "Ideas",
    isPinned: false,
    color: "yellow",
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 7200000,
  },
];

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [sortBy, setSortByState] = useState<SortOption>("updatedAt");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [rawNotes, rawSort] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(SORT_KEY),
        ]);
        if (rawNotes) {
          setNotes(JSON.parse(rawNotes));
        } else {
          setNotes(SAMPLE_NOTES);
        }
        if (rawSort) {
          setSortByState(rawSort as SortOption);
        }
      } catch {
        setNotes(SAMPLE_NOTES);
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes)).catch(() => {});
  }, [notes, loaded]);

  const setSortBy = useCallback((sort: SortOption) => {
    setSortByState(sort);
    AsyncStorage.setItem(SORT_KEY, sort).catch(() => {});
  }, []);

  const createNote = useCallback(
    (noteData: Omit<Note, "id" | "createdAt" | "updatedAt">): Note => {
      const now = Date.now();
      const note: Note = {
        ...noteData,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      setNotes((prev) => [note, ...prev]);
      return note;
    },
    []
  );

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
      )
    );
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const togglePin = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: Date.now() } : n
      )
    );
  }, []);

  const getNoteById = useCallback(
    (id: string) => notes.find((n) => n.id === id),
    [notes]
  );

  const searchNotes = useCallback(
    (query: string): Note[] => {
      const q = query.toLowerCase().trim();
      if (!q) return notes;
      return notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.category.toLowerCase().includes(q)
      );
    },
    [notes]
  );

  const getAllCategories = useCallback((): string[] => {
    const cats = new Set(notes.map((n) => n.category).filter(Boolean));
    return Array.from(cats);
  }, [notes]);

  const sortedNotes = React.useMemo(() => {
    const pinned = notes.filter((n) => n.isPinned);
    const unpinned = notes.filter((n) => !n.isPinned);
    const sortFn = (a: Note, b: Note) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "createdAt") return b.createdAt - a.createdAt;
      return b.updatedAt - a.updatedAt;
    };
    return [...pinned.sort(sortFn), ...unpinned.sort(sortFn)];
  }, [notes, sortBy]);

  return (
    <NotesContext.Provider
      value={{
        notes: sortedNotes,
        sortBy,
        setSortBy,
        createNote,
        updateNote,
        deleteNote,
        togglePin,
        getNoteById,
        searchNotes,
        getAllCategories,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes(): NotesContextType {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotes must be used within NotesProvider");
  return ctx;
}
