import { NextRequest, NextResponse } from "next/server";
import { ensureAuthBootstrap, registerClientAccount } from "@/lib/auth/service";
import { enforceRedisAuthRateLimit } from "@/lib/auth/rateLimit";
import { handleApiError } from "@/lib/security/api";
import { assertSameOrigin, getClientIpFromHeaders } from "@/lib/security/request";
import { registerSchema } from "@/lib/validators/auth";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await ensureAuthBootstrap();
    const rate = await enforceRedisAuthRateLimit({
      key: `auth:register:${getClientIpFromHeaders(request.headers)}`,
      limit: 5,
      windowSeconds: 15 * 60,
    });

    if (rate.limited) {
      return NextResponse.redirect(new URL("/register?error=Too%20many%20attempts.", request.url), 303);
    }

    const formData = await request.formData();
    const parsed = registerSchema.safeParse({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      next: formData.get("next"),
    });

    if (!parsed.success) {
      return NextResponse.redirect(new URL("/register?error=Please%20check%20your%20details.", request.url), 303);
    }

    const result = await registerClientAccount(parsed.data);
    const url = new URL("/verify-email?sent=1", request.url);

    if (process.env.NODE_ENV !== "production") {
      url.searchParams.set("token", result.verificationToken);
    }

    return NextResponse.redirect(url, 303);
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : "Registration%20failed.";
    return NextResponse.redirect(new URL(`/register?error=${message}`, request.url), 303);
  }
}
