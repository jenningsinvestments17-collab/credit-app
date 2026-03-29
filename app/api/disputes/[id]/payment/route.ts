import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { requestEligiblePayment } from "@/lib/services/paymentService";
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

    const result = await requestEligiblePayment(disputeId, {
      baseUrl: request.nextUrl.origin,
    });
    const url = new URL(returnTo, request.url);
    url.searchParams.set("mailing", "payment-requested");
    url.searchParams.set("payment", result.payment.status);
    return NextResponse.redirect(url, 303);
  } catch (error) {
    return handleApiError(error);
  }
}
