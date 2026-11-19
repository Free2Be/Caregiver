// Mirrors backend/lib/schema.ts. Keep the two in sync.
export type Explanation = {
  readable: boolean;
  document_type: string;
  urgent_warning: string;
  summary: string;
  terms_explained: { term: string; meaning: string }[];
  next_steps: { action: string; deadline: string; why: string }[];
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
