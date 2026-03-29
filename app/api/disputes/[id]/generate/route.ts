import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { getLeadById } from "@/lib/leads";
import { generateDisputeForLead } from "@/lib/services/disputeService";
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

    const leadId = assertSafeId(params.id, "lead id");
    const lead = getLeadById(leadId);
    if (!lead) {
      return jsonError("Lead not found.", 404);
    }

    const formData = await request.formData().catch(() => null);
    const returnTo = sanitizeRelativePath(
      (formData?.get("returnTo") as string | null) ?? `/admin/leads/${leadId}`,
      `/admin/leads/${leadId}`,
    );

    await generateDisputeForLead(lead, admin.email);
    const url = new URL(returnTo, request.url);
    url.searchParams.set("ai", "generated");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    return handleApiError(error);
  }
}
