import type {
  ContractStatus,
  DisputeStatus,
  DocumentStatus,
  LeadStatus,
  MailingProviderStatus,
  MailingWorkflowStatus,
  PaymentStatus,
} from "@/lib/types";

export function formatWorkflowLabel(value: string) {
  return value.replaceAll("_", " ");
}

export const leadStatusLabels: Record<LeadStatus, string> = {
  new_lead: "New Lead",
  consultation_booked: "Consultation Booked",
  intake_started: "Intake Started",
  intake_completed: "Intake Completed",
  awaiting_documents: "Awaiting Documents",
  ready_for_review: "Ready For Review",
  active_client: "Active Client",
  closed: "Closed",
};

export const documentStatusLabels: Record<DocumentStatus, string> = {
  missing: "Missing",
  uploaded: "Uploaded",
  validated: "Validated",
  rejected: "Rejected",
  needs_review: "Needs Review",
  partially_uploaded: "Partially Uploaded",
  complete: "Complete",
  under_review: "Under Review",
};

export const disputeStatusLabels: Record<DisputeStatus, string> = {
  not_ready: "Not Ready",
  documents_pending: "Documents Pending",
  documents_submitted: "Documents Submitted",
  documents_verified: "Documents Verified",
  eligible_for_processing: "Eligible For Processing",
  queued_for_ai: "Queued For AI",
  ready_for_ai: "Ready For AI",
  ai_in_progress: "AI In Progress",
  ai_generated: "AI Generated",
  draft_generated: "Draft Generated",
  awaiting_admin_review: "Awaiting Admin Review",
  rejected: "Rejected",
  approved: "Approved",
  service_rendered: "Service Rendered",
  queued_for_mailing: "Queued For Mailing",
  mailed: "Mailed",
};

export const mailingStatusLabels: Record<MailingWorkflowStatus, string> = {
  awaiting_admin_approval: "Awaiting Admin Approval",
  approved_pending_pdf: "Approved Pending PDF",
  awaiting_payment: "Awaiting Payment",
  paid_ready_to_send: "Paid Ready To Send",
  queued_for_send: "Queued For Send",
  sent_to_provider: "Sent To Provider",
  tracking_pending: "Tracking Pending",
  tracking_received: "Tracking Received",
  delivered: "Delivered",
  failed: "Failed",
};

export const contractStatusLabels: Record<ContractStatus, string> = {
  not_sent: "Not Sent",
  sent: "Sent",
  awaiting_signature: "Awaiting Signature",
  partially_signed: "Partially Signed",
  signed: "Signed",
  completed: "Completed",
};

export const mailingProviderStatusLabels: Record<MailingProviderStatus, string> = {
  not_submitted: "Not Submitted",
  queued: "Queued",
  submitted: "Submitted",
  accepted: "Accepted",
  tracking_received: "Tracking Received",
  delivered: "Delivered",
  failed: "Failed",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  payment_not_collected: "Payment Not Collected",
  authorized: "Authorized",
  authorization_expired: "Authorization Expired",
  payment_required: "Payment Required",
  payment_failed: "Payment Failed",
  ready_to_capture: "Ready To Capture",
  captured: "Captured",
  refunded: "Refunded",
};
