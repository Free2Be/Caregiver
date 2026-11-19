import { z } from "zod";

// The shape of every explanation. The zod schema validates what comes back;
// the JSON schema is what Claude is constrained to produce.
export const ExplanationSchema = z.object({
  readable: z.boolean(),
  document_type: z.string(),
  urgent_warning: z.string(),
  summary: z.string(),
  terms_explained: z.array(z.object({ term: z.string(), meaning: z.string() })),
  next_steps: z.array(
    z.object({ action: z.string(), deadline: z.string(), why: z.string() }),
  ),
  questions_for_doctor: z.array(z.string()),
  costs_and_coverage: z.string(),
  is_denial: z.boolean(),
  appeal_letter: z.string(),
});

export type Explanation = z.infer<typeof ExplanationSchema>;

const str = { type: "string" } as const;

export const explanationJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "readable",
    "document_type",
    "urgent_warning",
    "summary",
    "terms_explained",
    "next_steps",
    "questions_for_doctor",
    "costs_and_coverage",
    "is_denial",
    "appeal_letter",
  ],
  properties: {
    readable: { type: "boolean" },
    document_type: str,
    urgent_warning: str,
    summary: str,
    terms_explained: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["term", "meaning"],
        properties: { term: str, meaning: str },
      },
    },
    next_steps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["action", "deadline", "why"],
        properties: { action: str, deadline: str, why: str },
      },
    },
    questions_for_doctor: { type: "array", items: str },
    costs_and_coverage: str,
    is_denial: { type: "boolean" },
    appeal_letter: str,
  },
};
