import { NextResponse } from "next/server";
import { LIMITS, limitsAreShared } from "@/lib/limits";

export const dynamic = "force-dynamic";

// Quick check that the server is up and configured. Reveals no secrets.
export function GET() {
  return NextResponse.json({
    ok: true,
    apiKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    appKeyRequired: Boolean(process.env.APP_KEY),
    sharedLimits: limitsAreShared,
    dailyLimits: LIMITS,
  });
}
