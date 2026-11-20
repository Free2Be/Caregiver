// Mirrors backend/lib/schema.ts. Keep the two in sync.
export type Explanation = {
  readable: boolean;
  document_type: string;
  urgent_warning: string;
  summary: string;
  terms_explained: { term: string; meaning: string }[];
  // due_date (YYYY-MM-DD or "") is missing from results saved by older server versions.
  next_steps: { action: string; deadline: string; due_date?: string; why: string }[];
  questions_for_doctor: string[];
  costs_and_coverage: string;
  is_denial: boolean;
  appeal_letter: string;
  // Missing from results saved by older server versions.
  medications?: { name: string; dose: string; instructions: string; change: "new" | "changed" | "stopped" | "continue" | "unclear" }[];
  appointments?: { title: string; date: string; time: string; location: string; notes: string }[];
};

export type ExplainResult = { explanation: Explanation; demo?: boolean };

// One page the user has added: a photo (already shrunk to JPEG) or a PDF.
export type Page = {
  uri: string;
  name: string;
  mimeType: "image/jpeg" | "application/pdf";
};

// An explanation saved on this phone. done holds the indexes of finished to-dos.
export type SavedDoc = {
  id: string;
  savedAt: string; // ISO timestamp
  title: string;
  explanation: Explanation;
  demo?: boolean;
  done: number[];
};

// What the server reads off a prescription label. Mirrors backend MedLabelSchema.
export type MedLabel = {
  readable: boolean;
  name: string;
  strength: string;
  dose: string;
  instructions: string;
  times_per_day: number;
  as_needed: boolean;
  bedtime: boolean;
  with_food: string;
  purpose: string;
  prescriber: string;
  pharmacy: string;
  rx_number: string;
  refills: string;
  warnings: string[];
};

export type Medicine = {
  id: string;
  name: string;
  strength: string;
  dose: string;
  instructions: string;
  times: string[]; // "HH:MM", 24-hour, sorted
  asNeeded: boolean;
  withFood: string;
  purpose: string;
  prescriber: string;
  pharmacy: string;
  refills: string;
  warnings: string[];
  notes: string;
  remind: boolean;
  active: boolean;
  createdAt: string;
  notificationIds: string[];
};

export type Appointment = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // "HH:MM" or ""
  location: string;
  notes: string;
  remind: boolean;
  createdAt: string;
  notificationIds: string[];
};

export type DoseStatus = "taken" | "skipped";
// doseLog[YYYY-MM-DD][`${medId}@${HH:MM}`] = status
export type DoseLog = Record<string, Record<string, DoseStatus>>;
