import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { approveGeneratedDispute } from "@/lib/services/disputeService";
import { handleApiError, jsonError } from "@/lib/security/api";
import { assertSafeId, assertSameOrigin, sanitizeRelativePath } from "@/lib/security/request";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    assertSameOrigin(request);
    const admin = await getAuthenticatedAdmin();

    if (!admin) {
      return jsonError("Unauthorized.", 401);
    }

    const disputeId = assertSafeId(params.id, "dispute id");
    const formData = await request.formData().catch(() => null);
    const returnTo = sanitizeRelativePath(
      (formData?.get("returnTo") as string | null) ?? "/admin/mail-queue",
      "/admin/mail-queue",
    );

    await approveGeneratedDispute(disputeId, admin.email);
    const url = new URL(returnTo, request.url);
    url.searchParams.set("mailing", "approved");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    return handleApiError(error);
  }
}
