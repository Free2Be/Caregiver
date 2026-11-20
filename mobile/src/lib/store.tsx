import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { File } from "expo-file-system";
import { Platform } from "react-native";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ExplainResult, Page, SavedDoc } from "./types";

// Everything is stored only on this phone. Nothing is sent anywhere.
const DOCS_KEY = "docs-v1";
const DRAFT_KEY = "draft-v1";

export type Draft = { pages: Page[]; question: string };
const EMPTY_DRAFT: Draft = { pages: [], question: "" };

type Store = {
  loaded: boolean;
  docs: SavedDoc[];
  draft: Draft;
  setDraft: (d: Draft) => void;
  saveResult: (r: ExplainResult) => string;
  toggleStep: (docId: string, index: number) => void;
  removeDoc: (docId: string) => void;
  clearAll: () => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

// Android can clear the temporary folder that holds page photos. Drop pages whose
// file is gone so the draft never points at missing files.
function existingPages(pages: Page[]): Page[] {
  if (Platform.OS === "web") return [];
  return pages.filter((p) => {
    try {
      return new File(p.uri).exists;
    } catch {
      return false;
    }
  });
}

function save(key: string, value: unknown) {
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [docs, setDocs] = useState<SavedDoc[]>([]);
  const [draft, setDraftState] = useState<Draft>(EMPTY_DRAFT);

  useEffect(() => {
    (async () => {
      try {
        const [d, dr] = await Promise.all([AsyncStorage.getItem(DOCS_KEY), AsyncStorage.getItem(DRAFT_KEY)]);
        if (d) setDocs(JSON.parse(d));
        if (dr) {
          const saved: Draft = JSON.parse(dr);
          setDraftState({ question: saved.question ?? "", pages: existingPages(saved.pages ?? []) });
        }
      } catch {
        // Unreadable storage: start fresh rather than crash.
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Write-through updates so nothing is lost if the app is closed.
  const updateDocs = useCallback((fn: (prev: SavedDoc[]) => SavedDoc[]) => {
    setDocs((prev) => {
      const next = fn(prev);
      save(DOCS_KEY, next);
      return next;
    });
  }, []);

  const setDraft = useCallback((d: Draft) => {
    setDraftState(d);
    // Browser page files (blob: links) don't survive a reload, so only keep the question there.
    save(DRAFT_KEY, Platform.OS === "web" ? { pages: [], question: d.question } : d);
  }, []);

  const saveResult = useCallback(
    (r: ExplainResult) => {
      const id = Crypto.randomUUID();
      const doc: SavedDoc = {
        id,
        savedAt: new Date().toISOString(),
        title: r.explanation.document_type || "Document",
        explanation: r.explanation,
        demo: r.demo,
        done: [],
      };
      updateDocs((prev) => [doc, ...prev]);
      return id;
    },
    [updateDocs],
  );

  const toggleStep = useCallback(
    (docId: string, index: number) =>
      updateDocs((prev) =>
        prev.map((d) =>
          d.id !== docId
            ? d
            : { ...d, done: d.done.includes(index) ? d.done.filter((i) => i !== index) : [...d.done, index] },
        ),
      ),
    [updateDocs],
  );

  const removeDoc = useCallback((docId: string) => updateDocs((prev) => prev.filter((d) => d.id !== docId)), [updateDocs]);

  const clearAll = useCallback(async () => {
    setDocs([]);
    setDraftState(EMPTY_DRAFT);
    await AsyncStorage.multiRemove([DOCS_KEY, DRAFT_KEY]);
  }, []);

  const value = useMemo(
    () => ({ loaded, docs, draft, setDraft, saveResult, toggleStep, removeDoc, clearAll }),
    [loaded, docs, draft, setDraft, saveResult, toggleStep, removeDoc, clearAll],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}
