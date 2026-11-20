import { NextResponse } from "next/server";
import { MED_LABEL_PROMPT } from "@/lib/prompt";
import { SAMPLE_MED_LABEL } from "@/lib/sample";
import { MedLabelSchema, medLabelJsonSchema } from "@/lib/schema";
import { askClaude, isDemo, readUpload } from "@/lib/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Reads a photo of a prescription label or pill bottle.
export async function POST(req: Request) {
  const upload = await readUpload(req, 2);
  if (!upload.ok) return upload.response;
  if (isDemo()) return NextResponse.json({ label: SAMPLE_MED_LABEL, demo: true });

  const result = await askClaude(req, upload.deviceId, {
    system: MED_LABEL_PROMPT,
    content: [...upload.content, { type: "text", text: "Copy what this medicine label says." }],
    jsonSchema: medLabelJsonSchema,
    zod: MedLabelSchema,
  });
  return result.ok ? NextResponse.json({ label: result.data }) : result.response;
}
