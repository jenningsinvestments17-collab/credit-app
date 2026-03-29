import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { updateDisputeEscalationStage } from "@/lib/disputes/service";
import { handleApiError, jsonError } from "@/lib/security/api";
import { assertSafeId, assertSameOrigin, sanitizeRelativePath } from "@/lib/security/request";
import type { EscalationStage } from "@/lib/types";

const STAGES: EscalationStage[] = [
  "initial_dispute",
  "reinforcement_dispute",
  "formal_escalation_notice",
  "claim_preparation",
  "external_action",
];

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
    const formData = await request.formData();
    const modeValue = String(formData.get("mode") ?? "");
    const returnTo = sanitizeRelativePath(
      (formData.get("returnTo") as string | null) ?? "/admin/mail-queue",
      "/admin/mail-queue",
    );

    if (modeValue !== "advance" && modeValue !== "override") {
      return jsonError("Invalid escalation mode.", 400);
    }

    const targetStageValue = String(formData.get("targetStage") ?? "");
    const targetStage =
      STAGES.find((stage) => stage === targetStageValue) ??
      undefined;

    const result = await updateDisputeEscalationStage({
      disputeId,
      actorId: admin.email,
      mode: modeValue,
      targetStage,
    });

    const url = new URL(returnTo, request.url);
    url.searchParams.set("escalation", result.dispute.escalationStage ?? "updated");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    return handleApiError(error);
  }
}
