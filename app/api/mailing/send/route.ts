import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { sendEligibleCertifiedMail } from "@/lib/services/mailingService";
import { handleApiError, jsonError } from "@/lib/security/api";
import { assertSafeId, assertSameOrigin, sanitizeRelativePath } from "@/lib/security/request";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const admin = await getAuthenticatedAdmin();

    if (!admin) {
      return jsonError("Unauthorized.", 401);
    }

    const formData = await request.formData();
    const disputeId = assertSafeId(String(formData.get("disputeId") || ""), "dispute id");
    const returnTo = sanitizeRelativePath(
      (formData.get("returnTo") as string | null) ?? "/admin/mail-queue",
      "/admin/mail-queue",
    );

    await sendEligibleCertifiedMail(disputeId);
    const url = new URL(returnTo, request.url);
    url.searchParams.set("mailing", "sent");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    return handleApiError(error);
  }
}
