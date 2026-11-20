import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { ExplanationSchema, explanationJsonSchema } from "@/lib/schema";
import { SYSTEM_PROMPT, userInstruction } from "@/lib/prompt";
import { SAMPLE_EXPLANATION } from "@/lib/sample";
import { LIMITS, checkAndCount } from "@/lib/limits";

export const runtime = "nodejs";
export const maxDuration = 120; // seconds; reading a multi-page PDF can take a while

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const MAX_FILES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // API limit per image
const MAX_PDF_BYTES = 4 * 1024 * 1024; // the host rejects request bodies over ~4.5 MB
const MAX_PDF_PAGES = 10; // keeps the cost of one request bounded
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type ImageType = (typeof IMAGE_TYPES)[number];

const LIMIT_MESSAGES = {
  device: `You've reached today's limit of ${LIMITS.perDevice} documents. Please come back tomorrow.`,
  ip: "Too many documents from this network today. Please try again tomorrow.",
  global: "We've hit our limit for today. Please try again tomorrow.",
};

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Rough page count: each page object in a PDF has "/Type /Page" (not "/Pages").
function countPdfPages(buf: Buffer): number {
  return (buf.toString("latin1").match(/\/Type\s*\/Page(?![a-zA-Z])/g) ?? []).length;
}

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: Request) {
  // Optional shared key baked into the app, so casual visitors can't call the API directly.
  const appKey = process.env.APP_KEY?.trim();
  if (appKey && req.headers.get("x-app-key")?.trim() !== appKey) {
    return fail("Not allowed.", 401);
  }
  const deviceId = (req.headers.get("x-device-id") || "").slice(0, 64);
  if (!/^[\w-]{8,64}$/.test(deviceId)) return fail("Please update the app and try again.", 400);

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
    const buf = Buffer.from(await file.arrayBuffer());
    const data = buf.toString("base64");
    // Catch files that were damaged on the way, which Claude would reject anyway.
    const intact =
      file.type === "application/pdf"
        ? buf.subarray(0, 5).toString("latin1") === "%PDF-"
        : file.type === "image/jpeg"
          ? buf[0] === 0xff && buf[1] === 0xd8
          : true;
    if (!intact) return fail(`"${file.name}" arrived damaged (${buf.length} bytes). Please try again.`);
    if (file.type === "application/pdf") {
      if (file.size > MAX_PDF_BYTES) return fail(`"${file.name}" is over 4 MB. Try photos of the pages instead.`);
      if (countPdfPages(buf) > MAX_PDF_PAGES) {
        return fail(`"${file.name}" has more than ${MAX_PDF_PAGES} pages. Please upload just the pages you need explained.`);
      }
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

  const limit = await checkAndCount(deviceId, clientIp(req));
  if (!limit.ok) return fail(LIMIT_MESSAGES[limit.reason], 429);

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
      // Claude's own reason, e.g. a problem with the image or the request. Contains no secrets.
      const reason = (error.error as { error?: { message?: string } } | undefined)?.error?.message || error.message;
      return fail(`We couldn't read that file. Try a clearer photo or a different PDF. (${reason})`, 400);
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Claude API error ${error.status}`, error.message);
      return fail("The explainer is having trouble. Please try again shortly.", 502);
    }
    console.error(error);
    return fail("Something went wrong. Please try again.", 500);
  }
}
