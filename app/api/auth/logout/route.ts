import { NextRequest, NextResponse } from "next/server";
import { revokeCurrentSession } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/security/request";

export async function POST(request: NextRequest) {
  assertSameOrigin(request);
  await revokeCurrentSession();
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
