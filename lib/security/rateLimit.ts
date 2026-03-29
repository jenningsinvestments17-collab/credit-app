import { NextResponse } from "next/server";
import { incrementOpsCounter, recordDurationMetric } from "@/lib/monitoring/ops";
import { updateRateLimitStore } from "@/lib/security/rateLimitStore";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
  label: string;
};

export async function checkRateLimit(options: RateLimitOptions) {
  const startedAt = Date.now();
  const result = await updateRateLimitStore({
    key: options.key,
    limit: options.limit,
    windowMs: options.windowMs,
  });

  if (result.count > Math.max(Math.floor(options.limit * 0.6), 1)) {
    const delay = Math.min((result.count - Math.floor(options.limit * 0.6)) * 200, 1200);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  await recordDurationMetric("ratelimit.check_ms", Date.now() - startedAt);
  if (result.limited) {
    await incrementOpsCounter(`ratelimit.blocked.${options.label}`);
  }

  return result;
}

export function buildRateLimitResponse(retryAfterSeconds: number, label: string) {
  return NextResponse.json(
    {
      error: "Too many requests.",
      code: "rate_limited",
      message: `Too many ${label} attempts. Please wait and try again.`,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}
