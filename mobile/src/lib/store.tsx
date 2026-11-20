import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { File } from "expo-file-system";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import { cancelReminders, scheduleAppointment, scheduleMedicine } from "./reminders";
import type { Appointment, DoseLog, DoseStatus, ExplainResult, Medicine, Page, SavedDoc } from "./types";

// Everything is stored only on this phone. Nothing is sent anywhere.
const KEYS = {
  docs: "docs-v1",
  draft: "draft-v1",
  meds: "meds-v1",
  appts: "appts-v1",
  doses: "doses-v1",
} as const;

const DOSE_DAYS_KEPT = 90;

export type Draft = { pages: Page[]; question: string };
const EMPTY_DRAFT: Draft = { pages: [], question: "" };

export type MedicineInput = Omit<Medicine, "id" | "createdAt" | "notificationIds">;
export type AppointmentInput = Omit<Appointment, "id" | "createdAt" | "notificationIds">;

type Store = {
  loaded: boolean;
  docs: SavedDoc[];
  draft: Draft;
  meds: Medicine[];
  appts: Appointment[];
  doses: DoseLog;
  setDraft: (d: Draft) => void;
  saveResult: (r: ExplainResult) => string;
  toggleStep: (docId: string, index: number) => void;
  removeDoc: (docId: string) => void;
  saveMedicine: (input: MedicineInput, id?: string) => Promise<string>;
  removeMedicine: (id: string) => Promise<void>;
  setDose: (day: string, medId: string, time: string, status: DoseStatus | null) => void;
  saveAppointment: (input: AppointmentInput, id?: string) => Promise<string>;
  removeAppointment: (id: string) => Promise<void>;
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

function trimDoseLog(log: DoseLog): DoseLog {
  const cutoff = new Date(Date.now() - DOSE_DAYS_KEPT * 86_400_000).toISOString().slice(0, 10);
  return Object.fromEntries(Object.entries(log).filter(([day]) => day >= cutoff));
}

// State that is written to storage on every change.
function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const update = useCallback(
    (fn: (prev: T) => T) =>
      setValue((prev) => {
        const next = fn(prev);
        save(key, next);
        return next;
      }),
    [key],
  );
  return [value, setValue, update] as const;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [docs, setDocs, updateDocs] = usePersisted<SavedDoc[]>(KEYS.docs, []);
  const [meds, setMeds, updateMeds] = usePersisted<Medicine[]>(KEYS.meds, []);
  const [appts, setAppts, updateAppts] = usePersisted<Appointment[]>(KEYS.appts, []);
  const [doses, setDoses, updateDoses] = usePersisted<DoseLog>(KEYS.doses, {});
  const [draft, setDraftState] = useState<Draft>(EMPTY_DRAFT);
  // Latest values, for async actions that need to read current state.
  const medsRef = useRef(meds);
  medsRef.current = meds;
  const apptsRef = useRef(appts);
  apptsRef.current = appts;

  useEffect(() => {
    (async () => {
      try {
        const entries = await AsyncStorage.multiGet(Object.values(KEYS));
        const get = (k: string) => {
          const raw = entries.find(([key]) => key === k)?.[1];
          return raw ? JSON.parse(raw) : null;
        };
        setDocs(get(KEYS.docs) ?? []);
        setMeds(get(KEYS.meds) ?? []);
        setAppts(get(KEYS.appts) ?? []);
        setDoses(trimDoseLog(get(KEYS.doses) ?? {}));
        const dr = get(KEYS.draft) as Draft | null;
        if (dr) setDraftState({ question: dr.question ?? "", pages: existingPages(dr.pages ?? []) });
      } catch {
        // Unreadable storage: start fresh rather than crash.
      } finally {
        setLoaded(true);
      }
    })();
  }, [setDocs, setMeds, setAppts, setDoses]);

  const setDraft = useCallback((d: Draft) => {
    setDraftState(d);
    // Browser page files (blob: links) don't survive a reload, so only keep the question there.
    save(KEYS.draft, Platform.OS === "web" ? { pages: [], question: d.question } : d);
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
          d.id !== docId ? d : { ...d, done: d.done.includes(index) ? d.done.filter((i) => i !== index) : [...d.done, index] },
        ),
      ),
    [updateDocs],
  );

  const removeDoc = useCallback((docId: string) => updateDocs((prev) => prev.filter((d) => d.id !== docId)), [updateDocs]);

  // Saving a medicine replaces its reminders with ones for the current times.
  const saveMedicine = useCallback(
    async (input: MedicineInput, id?: string) => {
      const existing = id ? medsRef.current.find((m) => m.id === id) : undefined;
      if (existing) await cancelReminders(existing.notificationIds);
      const med: Medicine = {
        ...input,
        times: [...input.times].sort(),
        id: existing?.id ?? Crypto.randomUUID(),
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        notificationIds: [],
      };
      med.notificationIds = await scheduleMedicine(med).catch(() => []);
      updateMeds((prev) => (existing ? prev.map((m) => (m.id === med.id ? med : m)) : [...prev, med]));
      return med.id;
    },
    [updateMeds],
  );

  const removeMedicine = useCallback(
    async (id: string) => {
      const med = medsRef.current.find((m) => m.id === id);
      if (med) await cancelReminders(med.notificationIds);
      updateMeds((prev) => prev.filter((m) => m.id !== id));
    },
    [updateMeds],
  );

  const setDose = useCallback(
    (day: string, medId: string, time: string, status: DoseStatus | null) =>
      updateDoses((prev) => {
        const dayLog = { ...(prev[day] ?? {}) };
        const key = `${medId}@${time}`;
        if (status) dayLog[key] = status;
        else delete dayLog[key];
        return { ...prev, [day]: dayLog };
      }),
    [updateDoses],
  );

  const saveAppointment = useCallback(
    async (input: AppointmentInput, id?: string) => {
      const existing = id ? apptsRef.current.find((a) => a.id === id) : undefined;
      if (existing) await cancelReminders(existing.notificationIds);
      const appt: Appointment = {
        ...input,
        id: existing?.id ?? Crypto.randomUUID(),
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        notificationIds: [],
      };
      appt.notificationIds = await scheduleAppointment(appt).catch(() => []);
      updateAppts((prev) => (existing ? prev.map((a) => (a.id === appt.id ? appt : a)) : [...prev, appt]));
      return appt.id;
    },
    [updateAppts],
  );

  const removeAppointment = useCallback(
    async (id: string) => {
      const appt = apptsRef.current.find((a) => a.id === id);
      if (appt) await cancelReminders(appt.notificationIds);
      updateAppts((prev) => prev.filter((a) => a.id !== id));
    },
    [updateAppts],
  );

  const clearAll = useCallback(async () => {
    await cancelReminders([...medsRef.current, ...apptsRef.current].flatMap((x) => x.notificationIds));
    setDocs([]);
    setMeds([]);
    setAppts([]);
    setDoses({});
    setDraftState(EMPTY_DRAFT);
    await AsyncStorage.multiRemove(Object.values(KEYS));
  }, [setDocs, setMeds, setAppts, setDoses]);

  const value = useMemo(
    () => ({
      loaded, docs, draft, meds, appts, doses,
      setDraft, saveResult, toggleStep, removeDoc,
      saveMedicine, removeMedicine, setDose, saveAppointment, removeAppointment, clearAll,
    }),
    [loaded, docs, draft, meds, appts, doses, setDraft, saveResult, toggleStep, removeDoc,
      saveMedicine, removeMedicine, setDose, saveAppointment, removeAppointment, clearAll],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}
