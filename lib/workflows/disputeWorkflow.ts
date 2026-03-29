import type { DisputeRecord, DisputeWorkflowStatus } from "@/lib/types";

export const AI_WORKFLOW_STAGES: DisputeWorkflowStatus[] = [
  "documents_pending",
  "documents_submitted",
  "documents_verified",
  "eligible_for_processing",
  "queued_for_ai",
  "ai_in_progress",
  "ai_generated",
  "awaiting_admin_review",
  "rejected",
  "approved",
  "service_rendered",
  "queued_for_mailing",
  "mailed",
];

export function canQueueForAi(status: DisputeWorkflowStatus) {
  return ["eligible_for_processing", "rejected"].includes(status);
}

export function canGenerateAiDraft(status: DisputeWorkflowStatus) {
  return ["queued_for_ai", "ai_in_progress", "eligible_for_processing", "rejected"].includes(status);
}

export function canApproveGeneratedDispute(status: DisputeWorkflowStatus) {
  return ["ai_generated", "awaiting_admin_review"].includes(status);
}

export function canRejectGeneratedDispute(status: DisputeWorkflowStatus) {
  return ["ai_generated", "awaiting_admin_review"].includes(status);
}

export function canMarkServiceRendered(status: DisputeWorkflowStatus) {
  return status === "approved";
}

export function isApprovedForPayment(status: DisputeWorkflowStatus) {
  return status === "approved" || status === "service_rendered" || status === "queued_for_mailing" || status === "mailed";
}

export function isServiceRendered(status: DisputeWorkflowStatus, dispute?: Pick<DisputeRecord, "serviceRenderedAt"> | null) {
  return status === "service_rendered" || Boolean(dispute?.serviceRenderedAt);
}
