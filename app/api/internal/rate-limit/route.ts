import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { jsonError } from "@/lib/security/api";

export async function POST(request: NextRequest) {
  if (request.headers.get("x-internal-rate-limit") !== env.APP_SESSION_SECRET) {
    return jsonError("Unauthorized.", 401);
  }

  const body = (await request.json().catch(() => null)) as
    | {
        key?: string;
        limit?: number;
        windowMs?: number;
        label?: string;
      }
    | null;

  if (
    !body?.key ||
    typeof body.limit !== "number" ||
    typeof body.windowMs !== "number" ||
    !body.label
  ) {
    return jsonError("Invalid rate limit request.", 400);
  }

  const result = await checkRateLimit({
    key: body.key.slice(0, 300),
    limit: body.limit,
    windowMs: body.windowMs,
    label: body.label.slice(0, 100),
  });

  return NextResponse.json({
    limited: result.limited,
    retryAfter: Math.max(Math.ceil((result.resetAt - Date.now()) / 1000), 1),
    remaining: result.remaining,
    resetAt: result.resetAt,
  });
}
