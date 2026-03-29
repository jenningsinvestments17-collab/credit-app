import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetRequest, ensureAuthBootstrap } from "@/lib/auth/service";
import { enforceRedisAuthRateLimit } from "@/lib/auth/rateLimit";
import { assertSameOrigin, getClientIpFromHeaders } from "@/lib/security/request";
import { forgotPasswordSchema } from "@/lib/validators/auth";

export async function POST(request: NextRequest) {
  assertSameOrigin(request);
  await ensureAuthBootstrap();
  const rate = await enforceRedisAuthRateLimit({
    key: `auth:forgot:${getClientIpFromHeaders(request.headers)}`,
    limit: 5,
    windowSeconds: 15 * 60,
  });

  if (rate.limited) {
    return NextResponse.redirect(new URL("/forgot-password?sent=1", request.url), 303);
  }

  const formData = await request.formData();
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/forgot-password?sent=1", request.url), 303);
  }

  const result = await createPasswordResetRequest(parsed.data.email);
  const url = new URL("/forgot-password?sent=1", request.url);

  if (process.env.NODE_ENV !== "production" && result.resetToken) {
    url.searchParams.set("token", result.resetToken);
  }

  return NextResponse.redirect(url, 303);
}
