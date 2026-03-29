import { NextRequest, NextResponse } from "next/server";
import { ensureAuthBootstrap, verifyEmailAddress } from "@/lib/auth/service";
import { verifyEmailSchema } from "@/lib/validators/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await ensureAuthBootstrap();
  const parsed = verifyEmailSchema.safeParse({
    token: request.nextUrl.searchParams.get("token"),
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/verify-email", request.url), 303);
  }

  try {
    await verifyEmailAddress(parsed.data.token);
    return NextResponse.redirect(new URL("/verify-email?verified=1", request.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/verify-email?error=1", request.url), 303);
  }
}
