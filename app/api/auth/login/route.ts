import { NextRequest, NextResponse } from "next/server";
import { ensureAuthBootstrap, loginWithPassword } from "@/lib/auth/service";
import { enforceRedisAuthRateLimit } from "@/lib/auth/rateLimit";
import { handleApiError } from "@/lib/security/api";
import {
  assertSameOrigin,
  getClientIpFromHeaders,
  sanitizeRelativePath,
} from "@/lib/security/request";
import { loginSchema } from "@/lib/validators/auth";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await ensureAuthBootstrap();
    const rate = await enforceRedisAuthRateLimit({
      key: `auth:client:${getClientIpFromHeaders(request.headers)}`,
      limit: 5,
      windowSeconds: 15 * 60,
    });

    if (rate.limited) {
      return NextResponse.redirect(new URL("/login?error=1", request.url), 303);
    }

    const formData = await request.formData();
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      next: formData.get("next"),
    });

    if (!parsed.success) {
      return NextResponse.redirect(new URL("/login?error=1", request.url), 303);
    }

    const user = await loginWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
      scope: "client",
      ipAddress: getClientIpFromHeaders(request.headers),
      userAgent: request.headers.get("user-agent"),
    });

    if (!user || !user.emailVerifiedAt) {
      return NextResponse.redirect(new URL("/login?error=1", request.url), 303);
    }

    return NextResponse.redirect(
      new URL(sanitizeRelativePath(parsed.data.next, "/dashboard?resume=1"), request.url),
      303,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
