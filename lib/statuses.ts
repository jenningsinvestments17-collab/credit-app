export const LEAD_STATUSES = [
  "new_lead",
  "consultation_booked",
  "intake_started",
  "intake_completed",
  "awaiting_documents",
  "ready_for_review",
  "active_client",
  "closed",
] as const;

export const INTAKE_STEP_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
  "blocked",
] as const;

export const DOCUMENT_STATUSES = [
  "missing",
  "uploaded",
  "validated",
  "rejected",
  "needs_review",
  "partially_uploaded",
  "complete",
  "under_review",
] as const;

export const DISPUTE_STATUSES = [
  "not_ready",
  "documents_pending",
  "documents_submitted",
  "documents_verified",
  "eligible_for_processing",
  "queued_for_ai",
  "ready_for_ai",
  "ai_in_progress",
  "ai_generated",
  "draft_generated",
  "awaiting_admin_review",
  "rejected",
  "approved",
  "service_rendered",
  "queued_for_mailing",
  "mailed",
] as const;

export const MAILING_STATUSES = [
  "awaiting_admin_approval",
  "approved_pending_pdf",
  "awaiting_payment",
  "paid_ready_to_send",
  "queued_for_send",
  "sent_to_provider",
  "tracking_pending",
  "tracking_received",
  "delivered",
  "failed",
] as const;

export const CONTRACT_STATUSES = [
  "not_sent",
  "sent",
  "awaiting_signature",
  "partially_signed",
  "signed",
  "completed",
] as const;

export const BOOKING_STATUSES = ["not_booked", "booked", "completed"] as const;
export const INTAKE_STATUSES = ["not_started", "in_progress", "completed"] as const;
export const CONSULTATION_STATUSES = ["not_scheduled", "scheduled", "completed"] as const;
export const REPORT_READINESS_STATUSES = ["unknown", "not_ready", "partial", "ready"] as const;
export const PAYMENT_STATUSES = [
  "payment_not_collected",
  "authorized",
  "authorization_expired",
  "payment_required",
  "payment_failed",
  "ready_to_capture",
  "captured",
  "refunded",
] as const;
export const MAILING_PROVIDER_STATUSES = [
  "not_submitted",
  "queued",
  "submitted",
  "accepted",
  "tracking_received",
  "delivered",
  "failed",
] as const;
export const CERTIFIED_MAIL_QUEUE_STATUSES = [
  "pending",
  "queued",
  "processed",
  "mailed",
  "failed",
  "requeued",
] as const;
export const MAILING_DELIVERY_STATUSES = [
  "pending",
  "in_transit",
  "delivered",
  "returned",
  "issue",
] as const;

export type CanonicalLeadStatus = (typeof LEAD_STATUSES)[number];
export type CanonicalIntakeStepStatus = (typeof INTAKE_STEP_STATUSES)[number];
export type CanonicalDocumentStatus = (typeof DOCUMENT_STATUSES)[number];
export type CanonicalDisputeStatus = (typeof DISPUTE_STATUSES)[number];
export type CanonicalMailingStatus = (typeof MAILING_STATUSES)[number];
export type CanonicalContractStatus = (typeof CONTRACT_STATUSES)[number];
export type BookingStatusValue = (typeof BOOKING_STATUSES)[number];
export type IntakeStatusValue = (typeof INTAKE_STATUSES)[number];
export type ConsultationStatusValue = (typeof CONSULTATION_STATUSES)[number];
export type ReportReadinessStatusValue = (typeof REPORT_READINESS_STATUSES)[number];
export type PaymentStatusValue = (typeof PAYMENT_STATUSES)[number];
export type MailingProviderStatusValue = (typeof MAILING_PROVIDER_STATUSES)[number];
export type CertifiedMailQueueStatusValue = (typeof CERTIFIED_MAIL_QUEUE_STATUSES)[number];
export type MailingDeliveryStatusValue = (typeof MAILING_DELIVERY_STATUSES)[number];
