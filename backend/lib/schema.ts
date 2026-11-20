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
    z.object({ action: z.string(), deadline: z.string(), due_date: z.string(), why: z.string() }),
  ),
  questions_for_doctor: z.array(z.string()),
  costs_and_coverage: z.string(),
  is_denial: z.boolean(),
  appeal_letter: z.string(),
  medications: z.array(
    z.object({
      name: z.string(),
      dose: z.string(),
      instructions: z.string(),
      change: z.enum(["new", "changed", "stopped", "continue", "unclear"]),
    }),
  ),
  appointments: z.array(
    z.object({ title: z.string(), date: z.string(), time: z.string(), location: z.string(), notes: z.string() }),
  ),
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
    "medications",
    "appointments",
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
        required: ["action", "deadline", "due_date", "why"],
        properties: { action: str, deadline: str, due_date: str, why: str },
      },
    },
    questions_for_doctor: { type: "array", items: str },
    costs_and_coverage: str,
    is_denial: { type: "boolean" },
    appeal_letter: str,
    medications: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "dose", "instructions", "change"],
        properties: {
          name: str,
          dose: str,
          instructions: str,
          change: { type: "string", enum: ["new", "changed", "stopped", "continue", "unclear"] },
        },
      },
    },
    appointments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "date", "time", "location", "notes"],
        properties: { title: str, date: str, time: str, location: str, notes: str },
      },
    },
  },
};

// What can be read off a prescription label or pill bottle.
export const MedLabelSchema = z.object({
  readable: z.boolean(),
  name: z.string(),
  strength: z.string(),
  dose: z.string(),
  instructions: z.string(),
  times_per_day: z.number().int(),
  as_needed: z.boolean(),
  bedtime: z.boolean(),
  with_food: z.string(),
  purpose: z.string(),
  prescriber: z.string(),
  pharmacy: z.string(),
  rx_number: z.string(),
  refills: z.string(),
  warnings: z.array(z.string()),
});

export type MedLabel = z.infer<typeof MedLabelSchema>;

export const medLabelJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: Object.keys(MedLabelSchema.shape),
  properties: {
    readable: { type: "boolean" },
    name: str,
    strength: str,
    dose: str,
    instructions: str,
    times_per_day: { type: "integer" },
    as_needed: { type: "boolean" },
    bedtime: { type: "boolean" },
    with_food: str,
    purpose: str,
    prescriber: str,
    pharmacy: str,
    rx_number: str,
    refills: str,
    warnings: { type: "array", items: str },
  },
};
