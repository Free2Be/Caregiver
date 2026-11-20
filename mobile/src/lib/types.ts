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
