import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { ExplanationSchema, explanationJsonSchema } from "@/lib/schema";
import { SYSTEM_PROMPT, userInstruction } from "@/lib/prompt";
import { SAMPLE_EXPLANATION } from "@/lib/sample";

export const runtime = "nodejs";
export const maxDuration = 120; // seconds; reading a multi-page PDF can take a while

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const MAX_FILES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // API limit per image
const MAX_PDF_BYTES = 20 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type ImageType = (typeof IMAGE_TYPES)[number];

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Couldn't read the upload. Please try again.");
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const question = String(form.get("question") ?? "").slice(0, 500);

  if (files.length === 0) return fail("Please add a photo or PDF of the paperwork.");
  if (files.length > MAX_FILES) return fail(`Please upload ${MAX_FILES} files or fewer.`);

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  for (const file of files) {
    const data = Buffer.from(await file.arrayBuffer()).toString("base64");
    if (file.type === "application/pdf") {
      if (file.size > MAX_PDF_BYTES) return fail(`"${file.name}" is over 20 MB.`);
      content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data } });
    } else if ((IMAGE_TYPES as readonly string[]).includes(file.type)) {
      if (file.size > MAX_IMAGE_BYTES) return fail(`"${file.name}" is over 5 MB. Try a smaller photo.`);
      content.push({ type: "image", source: { type: "base64", media_type: file.type as ImageType, data } });
    } else {
      return fail(`"${file.name}" isn't a supported file. Use a JPG, PNG, or PDF.`);
    }
  }
  content.push({ type: "text", text: userInstruction(question) });

  // No key configured: return a sample so the page can be tried end to end.
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ explanation: SAMPLE_EXPLANATION, demo: true });
  }

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: explanationJsonSchema },
      },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });

    if (response.stop_reason === "refusal") {
      return fail("We couldn't process this document. Please try a different photo or file.", 422);
    }
    if (response.stop_reason === "max_tokens") {
      return fail("This document was too long to explain in one go. Try uploading fewer pages.", 422);
    }

    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const parsed = ExplanationSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      console.error("Unexpected response shape", parsed.error);
      return fail("Something went wrong reading the result. Please try again.", 502);
    }
    return NextResponse.json({ explanation: parsed.data });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return fail("We're busy right now. Please try again in a minute.", 429);
    }
    if (error instanceof Anthropic.BadRequestError) {
      console.error("Bad request to Claude", error.message);
      return fail("We couldn't read that file. Try a clearer photo or a different PDF.", 400);
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Claude API error ${error.status}`, error.message);
      return fail("The explainer is having trouble. Please try again shortly.", 502);
    }
    console.error(error);
    return fail("Something went wrong. Please try again.", 500);
  }
}
