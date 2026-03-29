import { mailTemplateMeta } from "@/lib/mail/templates";
import type { MailJob, MailJobStatus, MailTemplateType } from "@/lib/types";

export const mailJobStatusMeta: Record<
  MailJobStatus,
  { label: string; tone: string; description: string }
> = {
  pending: {
    label: "Pending",
    tone: "bg-accent/10 text-[#7d6434] border-accent/25",
    description: "Queued and waiting for provider delivery.",
  },
  sent: {
    label: "Sent",
    tone: "bg-emerald-500/12 text-emerald-200 border-emerald-400/20",
    description: "Accepted by the provider and logged as delivered from the queue.",
  },
  failed: {
    label: "Failed",
    tone: "bg-rose-500/12 text-rose-200 border-rose-400/20",
    description: "The queue attempted delivery but the provider did not accept it.",
  },
};

export function buildMailJob(input: {
  id: string;
  type: MailTemplateType;
  to: string;
  status?: MailJobStatus;
  leadId?: string;
  attempts?: number;
  maxAttempts?: number;
  queuedAt: string;
  updatedAt?: string;
  sentAt?: string;
  failedAt?: string;
  scheduledFor?: string;
  lastError?: string;
  provider?: string;
}): MailJob {
  return {
    id: input.id,
    leadId: input.leadId,
    audience: mailTemplateMeta[input.type].audience,
    type: input.type,
    to: input.to,
    subject: mailTemplateMeta[input.type].label,
    status: input.status ?? "pending",
    attempts: input.attempts ?? 0,
    maxAttempts: input.maxAttempts ?? 3,
    queuedAt: input.queuedAt,
    updatedAt: input.updatedAt ?? input.queuedAt,
    sentAt: input.sentAt,
    failedAt: input.failedAt,
    scheduledFor: input.scheduledFor,
    lastError: input.lastError,
    provider: input.provider,
  };
}

const mockMailJobs: MailJob[] = [
  buildMailJob({
    id: "mail_001",
    leadId: "lead_001",
    type: "booking_confirmation",
    to: "marcus@example.com",
    status: "sent",
    attempts: 1,
    queuedAt: "2026-03-23T08:12:00.000Z",
    updatedAt: "2026-03-23T08:13:00.000Z",
    sentAt: "2026-03-23T08:13:00.000Z",
    provider: "placeholder-provider",
  }),
  buildMailJob({
    id: "mail_002",
    leadId: "lead_001",
    type: "new_lead_alert",
    to: "admin@creduconsulting.com",
    status: "sent",
    attempts: 1,
    queuedAt: "2026-03-23T08:12:00.000Z",
    updatedAt: "2026-03-23T08:13:00.000Z",
    sentAt: "2026-03-23T08:13:00.000Z",
    provider: "placeholder-provider",
  }),
  buildMailJob({
    id: "mail_003",
    leadId: "lead_002",
    type: "intake_reminder",
    to: "tiana@example.com",
    status: "pending",
    attempts: 1,
    queuedAt: "2026-03-24T10:00:00.000Z",
    updatedAt: "2026-03-24T10:00:00.000Z",
    scheduledFor: "2026-03-25T10:00:00.000Z",
  }),
  buildMailJob({
    id: "mail_004",
    leadId: "lead_002",
    type: "missing_documents",
    to: "tiana@example.com",
    status: "failed",
    attempts: 2,
    maxAttempts: 3,
    queuedAt: "2026-03-24T15:00:00.000Z",
    updatedAt: "2026-03-24T15:03:00.000Z",
    failedAt: "2026-03-24T15:03:00.000Z",
    lastError: "Temporary provider rejection.",
  }),
  buildMailJob({
    id: "mail_005",
    leadId: "lead_003",
    type: "contracts_sent",
    to: "devon@example.com",
    status: "sent",
    attempts: 1,
    queuedAt: "2026-03-24T09:15:00.000Z",
    updatedAt: "2026-03-24T09:16:00.000Z",
    sentAt: "2026-03-24T09:16:00.000Z",
    provider: "placeholder-provider",
  }),
  buildMailJob({
    id: "mail_006",
    leadId: "lead_004",
    type: "intake_completed",
    to: "admin@creduconsulting.com",
    status: "sent",
    attempts: 1,
    queuedAt: "2026-03-24T10:46:00.000Z",
    updatedAt: "2026-03-24T10:46:00.000Z",
    sentAt: "2026-03-24T10:46:00.000Z",
    provider: "placeholder-provider",
  }),
  buildMailJob({
    id: "mail_007",
    leadId: "lead_004",
    type: "ready_for_ai_review",
    to: "admin@creduconsulting.com",
    status: "sent",
    attempts: 1,
    queuedAt: "2026-03-25T13:00:00.000Z",
    updatedAt: "2026-03-25T13:01:00.000Z",
    sentAt: "2026-03-25T13:01:00.000Z",
    provider: "placeholder-provider",
  }),
  buildMailJob({
    id: "mail_008",
    leadId: "lead_005",
    type: "contracts_signed",
    to: "andre@example.com",
    status: "sent",
    attempts: 1,
    queuedAt: "2026-03-24T11:10:00.000Z",
    updatedAt: "2026-03-24T11:10:00.000Z",
    sentAt: "2026-03-24T11:10:00.000Z",
    provider: "placeholder-provider",
  }),
];

export function getMailJobs() {
  return mockMailJobs;
}

export function getMailJobsForLead(leadId: string) {
  return mockMailJobs.filter((job) => job.leadId === leadId);
}

export function getMailQueueSummary() {
  const total = mockMailJobs.length;
  const pending = mockMailJobs.filter((job) => job.status === "pending").length;
  const sent = mockMailJobs.filter((job) => job.status === "sent").length;
  const failed = mockMailJobs.filter((job) => job.status === "failed").length;

  return { total, pending, sent, failed };
}

export function canRetryMailJob(job: MailJob) {
  return job.status === "failed" && job.attempts < job.maxAttempts;
}

export function getFailedMailJobs() {
  return mockMailJobs.filter((job) => job.status === "failed");
}

export function queueMailJob(input: Omit<MailJob, "status" | "attempts" | "maxAttempts">) {
  // Placeholder for future persistence:
  // 1. insert queued job into PostgreSQL
  // 2. publish to background worker / BullMQ
  return {
    ...input,
    status: "pending" as const,
    attempts: 0,
    maxAttempts: 3,
  };
}
