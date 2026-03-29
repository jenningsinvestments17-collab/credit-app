export const DOMAIN_EVENT_NAMES = {
  leadCreated: "lead.created",
  leadStatusChanged: "lead.status.changed",
  bookingCompleted: "booking.completed",
  intakeStarted: "intake.started",
  intakeStepCompleted: "intake.step.completed",
  intakeCompleted: "intake.completed",
  intakeResumePointUpdated: "intake.resume_point.updated",
  documentUploaded: "document.uploaded",
  reportsCompleted: "reports.completed",
  documentsCompleted: "documents.completed",
  documentsReadyForReview: "documents.ready_for_review",
  aiReviewRequested: "ai.review.requested",
  aiReviewCompleted: "ai.review.completed",
  disputeDraftGenerated: "dispute.draft.generated",
  disputeApproved: "dispute.approved",
  disputeFinalPdfGenerated: "dispute.final_pdf.generated",
  mailingPaymentRequested: "mailing.payment.requested",
  mailingPaymentCompleted: "mailing.payment.completed",
  paymentFailed: "payment.failed",
  paymentReauthorized: "payment.reauthorized",
  paymentCaptured: "payment.captured",
  certifiedMailQueued: "certified_mail.queued",
  certifiedMailSent: "certified_mail.sent",
  certifiedMailTrackingReceived: "certified_mail.tracking_received",
  certifiedMailDelivered: "certified_mail.delivered",
  contractPacketSent: "contract.packet.sent",
  contractSigned: "contract.signed",
  onboardingCompleted: "onboarding.completed",
} as const;

export type DomainEventName =
  (typeof DOMAIN_EVENT_NAMES)[keyof typeof DOMAIN_EVENT_NAMES];

export const ALL_DOMAIN_EVENT_NAMES = Object.values(
  DOMAIN_EVENT_NAMES,
) as DomainEventName[];

export const WORKFLOW_PROJECTION_EVENT_NAMES = [
  DOMAIN_EVENT_NAMES.leadCreated,
  DOMAIN_EVENT_NAMES.leadStatusChanged,
  DOMAIN_EVENT_NAMES.bookingCompleted,
  DOMAIN_EVENT_NAMES.intakeStarted,
  DOMAIN_EVENT_NAMES.intakeStepCompleted,
  DOMAIN_EVENT_NAMES.intakeCompleted,
  DOMAIN_EVENT_NAMES.documentUploaded,
  DOMAIN_EVENT_NAMES.reportsCompleted,
  DOMAIN_EVENT_NAMES.documentsCompleted,
  DOMAIN_EVENT_NAMES.documentsReadyForReview,
  DOMAIN_EVENT_NAMES.contractPacketSent,
  DOMAIN_EVENT_NAMES.contractSigned,
  DOMAIN_EVENT_NAMES.onboardingCompleted,
] as const;

export const ASYNC_REACTION_EVENT_NAMES = [
  DOMAIN_EVENT_NAMES.aiReviewRequested,
  DOMAIN_EVENT_NAMES.aiReviewCompleted,
  DOMAIN_EVENT_NAMES.disputeDraftGenerated,
  DOMAIN_EVENT_NAMES.disputeApproved,
  DOMAIN_EVENT_NAMES.disputeFinalPdfGenerated,
  DOMAIN_EVENT_NAMES.mailingPaymentRequested,
  DOMAIN_EVENT_NAMES.mailingPaymentCompleted,
  DOMAIN_EVENT_NAMES.paymentFailed,
  DOMAIN_EVENT_NAMES.paymentReauthorized,
  DOMAIN_EVENT_NAMES.paymentCaptured,
  DOMAIN_EVENT_NAMES.certifiedMailQueued,
  DOMAIN_EVENT_NAMES.certifiedMailSent,
  DOMAIN_EVENT_NAMES.certifiedMailTrackingReceived,
  DOMAIN_EVENT_NAMES.certifiedMailDelivered,
] as const;
