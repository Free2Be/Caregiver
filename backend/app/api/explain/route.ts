import { NextResponse } from "next/server";
import { ExplanationSchema, explanationJsonSchema } from "@/lib/schema";
import { SYSTEM_PROMPT, userInstruction } from "@/lib/prompt";
import { SAMPLE_EXPLANATION } from "@/lib/sample";
import { askClaude, isDemo, readUpload } from "@/lib/server";

export const runtime = "nodejs";
export const maxDuration = 120; // seconds; reading a multi-page PDF can take a while

export async function POST(req: Request) {
  const upload = await readUpload(req, 5);
  if (!upload.ok) return upload.response;

  const question = String(upload.form.get("question") ?? "").slice(0, 500);
  const content = [
    ...upload.content,
    { type: "text" as const, text: userInstruction(question, new Date().toISOString().slice(0, 10)) },
  ];

  // No key configured: return a sample so the app can be tried end to end.
  if (isDemo()) return NextResponse.json({ explanation: SAMPLE_EXPLANATION, demo: true });

  const result = await askClaude(req, upload.deviceId, {
    system: SYSTEM_PROMPT,
    content,
    jsonSchema: explanationJsonSchema,
    zod: ExplanationSchema,
  });
  return result.ok ? NextResponse.json({ explanation: result.data }) : result.response;
}
