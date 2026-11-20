import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { LIMITS, checkAndCount } from "./limits";

// Shared request handling for every endpoint that sends files to Claude.

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // API limit per image
const MAX_PDF_BYTES = 4 * 1024 * 1024; // the host rejects request bodies over ~4.5 MB
const MAX_PDF_PAGES = 10; // keeps the cost of one request bounded
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type ImageType = (typeof IMAGE_TYPES)[number];

const LIMIT_MESSAGES = {
  device: `You've reached today's limit of ${LIMITS.perDevice} uploads. Please come back tomorrow.`,
  ip: "Too many uploads from this network today. Please try again tomorrow.",
  global: "We've hit our limit for today. Please try again tomorrow.",
};

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Rough page count: each page object in a PDF has "/Type /Page" (not "/Pages").
function countPdfPages(buf: Buffer): number {
  return (buf.toString("latin1").match(/\/Type\s*\/Page(?![a-zA-Z])/g) ?? []).length;
}

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

export const isDemo = () => !process.env.ANTHROPIC_API_KEY;

type Parsed = { ok: true; form: FormData; deviceId: string; content: Anthropic.Beta.BetaContentBlockParam[] } | { ok: false; response: NextResponse };

// Checks the app key and device ID, reads the upload, and turns files into
// Claude content blocks. Returns an error response when anything is off.
export async function readUpload(req: Request, maxFiles: number): Promise<Parsed> {
  const appKey = process.env.APP_KEY?.trim();
  if (appKey && req.headers.get("x-app-key")?.trim() !== appKey) {
    return { ok: false, response: fail("Not allowed.", 401) };
  }
  const deviceId = (req.headers.get("x-device-id") || "").slice(0, 64);
  if (!/^[\w-]{8,64}$/.test(deviceId)) return { ok: false, response: fail("Please update the app and try again.") };

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return { ok: false, response: fail("Couldn't read the upload. Please try again.") };
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { ok: false, response: fail("Please add a photo or PDF.") };
  if (files.length > maxFiles) return { ok: false, response: fail(`Please upload ${maxFiles} files or fewer.`) };

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
    const bad = (msg: string) => ({ ok: false as const, response: fail(msg) });
    if (!intact) return bad(`"${file.name}" arrived damaged (${buf.length} bytes). Please try again.`);
    if (file.type === "application/pdf") {
      if (file.size > MAX_PDF_BYTES) return bad(`"${file.name}" is over 4 MB. Try photos of the pages instead.`);
      if (countPdfPages(buf) > MAX_PDF_PAGES) {
        return bad(`"${file.name}" has more than ${MAX_PDF_PAGES} pages. Please upload just the pages you need explained.`);
      }
      content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data } });
    } else if ((IMAGE_TYPES as readonly string[]).includes(file.type)) {
      if (file.size > MAX_IMAGE_BYTES) return bad(`"${file.name}" is over 5 MB. Try a smaller photo.`);
      content.push({ type: "image", source: { type: "base64", media_type: file.type as ImageType, data } });
    } else {
      return bad(`"${file.name}" isn't a supported file. Use a JPG, PNG, or PDF.`);
    }
  }
  return { ok: true, form, deviceId, content };
}

// Counts the request against the daily limits, asks Claude for JSON matching
// the schema, and validates it. Returns the parsed data or an error response.
export async function askClaude<T>(
  req: Request,
  deviceId: string,
  opts: { system: string; content: Anthropic.Beta.BetaContentBlockParam[]; jsonSchema: Record<string, unknown>; zod: ZodType<T> },
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  const limit = await checkAndCount(deviceId, clientIp(req));
  if (!limit.ok) return { ok: false, response: fail(LIMIT_MESSAGES[limit.reason], 429) };

  // Keys not tied to a workspace need the workspace named on every request.
  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID?.trim();
  const client = new Anthropic(workspaceId ? { defaultHeaders: { "anthropic-workspace-id": workspaceId } } : {});
  const err = (msg: string, status: number) => ({ ok: false as const, response: fail(msg, status) });

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: opts.jsonSchema } },
      system: opts.system,
      messages: [{ role: "user", content: opts.content }],
    });

    if (response.stop_reason === "refusal") return err("We couldn't process this. Please try a different photo or file.", 422);
    if (response.stop_reason === "max_tokens") return err("This was too long to read in one go. Try fewer pages.", 422);

    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const parsed = opts.zod.safeParse(JSON.parse(text));
    if (!parsed.success) {
      console.error("Unexpected response shape", parsed.error);
      return err("Something went wrong reading the result. Please try again.", 502);
    }
    return { ok: true, data: parsed.data };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return err("We're busy right now. Please try again in a minute.", 429);
    if (error instanceof Anthropic.BadRequestError) {
      console.error("Bad request to Claude", error.message);
      // Claude's own reason, e.g. a problem with the image or the request. Contains no secrets.
      const reason = (error.error as { error?: { message?: string } } | undefined)?.error?.message || error.message;
      return err(`We couldn't read that file. Try a clearer photo or a different PDF. (${reason})`, 400);
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Claude API error ${error.status}`, error.message);
      return err("The service is having trouble. Please try again shortly.", 502);
    }
    console.error(error);
    return err("Something went wrong. Please try again.", 500);
  }
}
