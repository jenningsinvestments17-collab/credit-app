import { NextRequest, NextResponse } from "next/server";
import { ensureAuthBootstrap, resetPasswordWithToken } from "@/lib/auth/service";
import { enforceRedisAuthRateLimit } from "@/lib/auth/rateLimit";
import { assertSameOrigin, getClientIpFromHeaders } from "@/lib/security/request";
import { resetPasswordSchema } from "@/lib/validators/auth";

export async function POST(request: NextRequest) {
  assertSameOrigin(request);
  await ensureAuthBootstrap();
  const rate = await enforceRedisAuthRateLimit({
    key: `auth:reset:${getClientIpFromHeaders(request.headers)}`,
    limit: 5,
    windowSeconds: 15 * 60,
  });

  if (rate.limited) {
    return NextResponse.redirect(new URL("/reset-password?error=1", request.url), 303);
  }

  const formData = await request.formData();
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/reset-password?error=1", request.url), 303);
  }

  try {
    await resetPasswordWithToken({
      token: parsed.data.token,
      password: parsed.data.password,
    });
    return NextResponse.redirect(new URL("/login?reset=1", request.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/reset-password?error=1", request.url), 303);
  }
}
