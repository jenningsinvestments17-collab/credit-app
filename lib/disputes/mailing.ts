import type { Bureau, BureauRecipient, CertifiedMailQueueStatus, MailingWorkflowStatus } from "@/lib/types";

export const bureauRecipients: Record<Bureau, BureauRecipient> = {
  Experian: {
    bureau: "Experian",
    recipientName: "Experian",
    street1: "P.O. Box 4500",
    city: "Allen",
    state: "TX",
    postalCode: "75013",
  },
  Equifax: {
    bureau: "Equifax",
    recipientName: "Equifax Information Services LLC",
    street1: "P.O. Box 740256",
    city: "Atlanta",
    state: "GA",
    postalCode: "30374",
  },
  TransUnion: {
    bureau: "TransUnion",
    recipientName: "TransUnion Consumer Solutions",
    street1: "P.O. Box 2000",
    city: "Chester",
    state: "PA",
    postalCode: "19016",
  },
};

export const disputeWorkflowStatusMeta: Record<
  MailingWorkflowStatus,
  { label: string; tone: string; description: string }
> = {
  awaiting_admin_approval: {
    label: "Awaiting Admin Approval",
    tone: "bg-zinc-900 text-zinc-200 border-white/10",
    description: "The dispute draft exists and still needs explicit admin approval before mailing can proceed.",
  },
  approved_pending_pdf: {
    label: "Approved Pending PDF",
    tone: "bg-accent/10 text-[#7d6434] border-accent/25",
    description: "The dispute is approved and waiting for a final mailing-ready PDF version.",
  },
  awaiting_payment: {
    label: "Awaiting Payment",
    tone: "bg-amber-500/12 text-amber-200 border-amber-400/20",
    description: "A final version exists and the system is ready to request payment before sending.",
  },
  paid_ready_to_send: {
    label: "Paid Ready To Send",
    tone: "bg-emerald-500/12 text-emerald-200 border-emerald-400/20",
    description: "Payment is confirmed and the mailing job can move into provider submission.",
  },
  queued_for_send: {
    label: "Queued For Send",
    tone: "bg-sky-500/12 text-sky-200 border-sky-400/20",
    description: "The mailing job is queued and waiting for provider submission processing.",
  },
  sent_to_provider: {
    label: "Sent To Provider",
    tone: "bg-indigo-500/12 text-indigo-200 border-indigo-400/20",
    description: "The certified mail provider accepted the mailing job.",
  },
  tracking_pending: {
    label: "Tracking Pending",
    tone: "bg-white/10 text-white border-white/10",
    description: "The mailing job was submitted and is waiting for tracking or carrier updates.",
  },
  tracking_received: {
    label: "Tracking Received",
    tone: "bg-indigo-500/12 text-indigo-200 border-indigo-400/20",
    description: "Tracking information is attached and delivery monitoring is underway.",
  },
  delivered: {
    label: "Delivered",
    tone: "bg-emerald-500/12 text-emerald-200 border-emerald-400/20",
    description: "Delivery has been confirmed for the final dispute mailing.",
  },
  failed: {
    label: "Failed",
    tone: "bg-rose-500/12 text-rose-200 border-rose-400/20",
    description: "The mailing workflow hit a blocking issue that needs correction or requeue handling.",
  },
};

export const certifiedMailQueueStatusMeta: Record<
  CertifiedMailQueueStatus,
  { label: string; tone: string }
> = {
  pending: { label: "Pending", tone: "bg-zinc-900 text-zinc-200 border-white/10" },
  queued: { label: "Queued", tone: "bg-accent/10 text-[#7d6434] border-accent/25" },
  processed: { label: "Processed", tone: "bg-sky-500/12 text-sky-200 border-sky-400/20" },
  mailed: { label: "Mailed", tone: "bg-indigo-500/12 text-indigo-200 border-indigo-400/20" },
  failed: { label: "Failed", tone: "bg-rose-500/12 text-rose-200 border-rose-400/20" },
  requeued: { label: "Requeued", tone: "bg-amber-500/12 text-amber-200 border-amber-400/20" },
};
