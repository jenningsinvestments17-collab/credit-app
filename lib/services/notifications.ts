import { findUserById } from "@/lib/db/auth";
import { env } from "@/lib/env";
import { buildNotificationJob, getAdminAlerts, getNotificationQueueSummary, queueNotificationJob } from "@/lib/queue/notificationQueue";
import type { Lead, NotificationChannel, NotificationJob, NotificationTemplateType, PaymentRecord } from "@/lib/types";

function nowIso() {
  return new Date().toISOString();
}

function buildDedupeKey(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(":");
}

async function enqueue(input: {
  userId?: string;
  leadId?: string;
  audience: "client" | "admin";
  channel: NotificationChannel;
  template: NotificationTemplateType;
  to: string;
  payload: Record<string, unknown>;
  dedupeKey?: string;
  scheduledFor?: string;
}) {
  const queuedAt = nowIso();
  return queueNotificationJob(
    buildNotificationJob({
      id: `notif_${input.template}_${queuedAt}_${Math.random().toString(36).slice(2, 8)}`,
      userId: input.userId,
      leadId: input.leadId,
      audience: input.audience,
      channel: input.channel,
      template: input.template,
      to: input.to,
      payload: input.payload,
      dedupeKey: input.dedupeKey,
      queuedAt,
      scheduledFor: input.scheduledFor,
    }),
  );
}

function getAdminNotificationTargets() {
  if (!env.ADMIN_ALERT_EMAIL_ENABLED) {
    return [];
  }

  return [
    {
      channel: "email" as const,
      to: env.ADMIN_BOOTSTRAP_EMAIL,
    },
  ];
}

async function queueAdminAlert(template: NotificationTemplateType, leadId: string | undefined, payload: Record<string, unknown>, dedupeKey: string) {
  return Promise.all(
    getAdminNotificationTargets().map((target) =>
      enqueue({
      audience: "admin",
      channel: target.channel,
      template,
      to: target.to,
      leadId,
      payload,
      dedupeKey: `${dedupeKey}:${target.channel}`,
      }),
    ),
  );
}

export async function queueAccountCreatedNotifications(input: {
  userId: string;
  email: string;
  phone?: string;
}) {
  const jobs: NotificationJob[] = [];
  jobs.push(
    await enqueue({
      userId: input.userId,
      audience: "client",
      channel: "email",
      template: "account_created",
      to: input.email,
      payload: {},
      dedupeKey: buildDedupeKey(["account_created", input.userId, "email"]),
    }),
  );

  if (input.phone && env.NOTIFICATION_SMS_ENABLED) {
    jobs.push(
      await enqueue({
        userId: input.userId,
        audience: "client",
        channel: "sms",
        template: "account_created",
        to: input.phone,
        payload: {},
        dedupeKey: buildDedupeKey(["account_created", input.userId, "sms"]),
      }),
    );
  }

  jobs.push(
    ...(await queueAdminAlert(
      "admin_account_created",
      undefined,
      {},
      buildDedupeKey(["admin_account_created", input.userId]),
    )),
  );

  return jobs;
}

export async function queueIntakeIncompleteNotifications(input: {
  userId?: string;
  lead: Lead;
}) {
  const scheduledFor = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const jobs: NotificationJob[] = [
    await enqueue({
      userId: input.userId,
      leadId: input.lead.id,
      audience: "client",
      channel: "email",
      template: "intake_incomplete",
      to: input.lead.email,
      payload: {
        nextStep: "return to your intake and finish the current step",
      },
      dedupeKey: buildDedupeKey(["intake_incomplete", input.lead.id, input.lead.intakeStatus]),
      scheduledFor,
    }),
  ];

  if (input.lead.phone && env.NOTIFICATION_SMS_ENABLED) {
    jobs.push(
        await enqueue({
        userId: input.userId,
        leadId: input.lead.id,
        audience: "client",
        channel: "sms",
        template: "intake_incomplete",
        to: input.lead.phone,
        payload: {
          nextStep: "return to your intake and finish the current step",
        },
        dedupeKey: buildDedupeKey(["intake_incomplete", input.lead.id, "sms", input.lead.intakeStatus]),
        scheduledFor,
      }),
    );
  }

  return jobs;
}

export async function queueDocumentsMissingNotifications(input: {
  userId?: string;
  lead: Lead;
}) {
  const jobs: NotificationJob[] = [
    await enqueue({
      userId: input.userId,
      leadId: input.lead.id,
      audience: "client",
      channel: "email",
      template: "documents_missing",
      to: input.lead.email,
      payload: {},
      dedupeKey: buildDedupeKey(["documents_missing", input.lead.id]),
    }),
  ];

  if (input.lead.phone && env.NOTIFICATION_SMS_ENABLED) {
    jobs.push(
        await enqueue({
        userId: input.userId,
        leadId: input.lead.id,
        audience: "client",
        channel: "sms",
        template: "documents_missing",
        to: input.lead.phone,
        payload: {},
        dedupeKey: buildDedupeKey(["documents_missing", input.lead.id, "sms"]),
      }),
    );
  }

  return jobs;
}

export async function queueDocumentsUploadedAdminAlert(input: {
  lead: Lead;
}) {
  return queueAdminAlert(
    "admin_documents_uploaded",
    input.lead.id,
    {},
    buildDedupeKey(["admin_documents_uploaded", input.lead.id, input.lead.updatedAt]),
  );
}

export async function queueAiDraftReadyNotifications(input: {
  lead: Lead;
}) {
  return [
    await enqueue({
      leadId: input.lead.id,
      audience: "client",
      channel: "email",
      template: "ai_draft_ready",
      to: input.lead.email,
      payload: {},
      dedupeKey: buildDedupeKey(["ai_draft_ready", input.lead.id]),
    }),
    ...(await queueAdminAlert(
      "admin_ai_draft_ready",
      input.lead.id,
      {},
      buildDedupeKey(["admin_ai_draft_ready", input.lead.id]),
    )),
  ];
}

export async function queuePaymentRequiredNotifications(input: {
  lead: Lead;
  payment: PaymentRecord;
}) {
  return [
    await enqueue({
      leadId: input.lead.id,
      audience: "client",
      channel: "email",
      template: "payment_required",
      to: input.lead.email,
      payload: {
        status: input.payment.status,
      },
      dedupeKey: buildDedupeKey(["payment_required", input.lead.id, input.payment.status]),
    }),
    ...(input.lead.phone && env.NOTIFICATION_SMS_ENABLED
      ? [
          await enqueue({
            leadId: input.lead.id,
            audience: "client",
            channel: "sms",
            template: "payment_required",
            to: input.lead.phone,
            payload: {
              status: input.payment.status,
            },
            dedupeKey: buildDedupeKey(["payment_required", input.lead.id, "sms", input.payment.status]),
          }),
        ]
      : []),
    ...(await queueAdminAlert(
      "admin_payment_required",
      input.lead.id,
      {
        paymentStatus: input.payment.status,
      },
      buildDedupeKey(["admin_payment_required", input.lead.id, input.payment.status]),
    )),
  ];
}

export async function queuePaymentSuccessNotifications(input: {
  lead: Lead;
  payment: PaymentRecord;
}) {
  return [
    await enqueue({
      leadId: input.lead.id,
      audience: "client",
      channel: "email",
      template: "payment_success",
      to: input.lead.email,
      payload: {
        amountCents: input.payment.amountCents,
      },
      dedupeKey: buildDedupeKey(["payment_success", input.lead.id, input.payment.status]),
    }),
    ...(await queueAdminAlert(
      "admin_payment_success",
      input.lead.id,
      {
        amountCents: input.payment.amountCents,
      },
      buildDedupeKey(["admin_payment_success", input.lead.id, input.payment.status]),
    )),
  ];
}

export async function queueMailSentNotifications(input: {
  lead: Lead;
  trackingNumber?: string;
}) {
  return [
    await enqueue({
      leadId: input.lead.id,
      audience: "client",
      channel: "email",
      template: "mail_sent",
      to: input.lead.email,
      payload: {
        hasTracking: Boolean(input.trackingNumber),
      },
      dedupeKey: buildDedupeKey(["mail_sent", input.lead.id]),
    }),
    ...(input.lead.phone && env.NOTIFICATION_SMS_ENABLED
      ? [
          await enqueue({
            leadId: input.lead.id,
            audience: "client",
            channel: "sms",
            template: "mail_sent",
            to: input.lead.phone,
            payload: {
              hasTracking: Boolean(input.trackingNumber),
            },
            dedupeKey: buildDedupeKey(["mail_sent", input.lead.id, "sms"]),
          }),
        ]
      : []),
    ...(await queueAdminAlert(
      "admin_mail_sent",
      input.lead.id,
      {
        hasTracking: Boolean(input.trackingNumber),
      },
      buildDedupeKey(["admin_mail_sent", input.lead.id]),
    )),
  ];
}

export async function getAdminNotificationAlerts() {
  return {
    summary: await getNotificationQueueSummary(),
    alerts: await getAdminAlerts(),
  };
}

export async function queueAdminFollowUpReminder(input: {
  userId: string;
  reason: "payment_required" | "missing_documents" | "stalled_case";
}) {
  const user = await findUserById(input.userId);
  if (!user) {
    throw new Error("User not found.");
  }

  return enqueue({
    userId: user.id,
    audience: "client",
    channel: "email",
    template: "admin_follow_up",
    to: user.email,
    payload: {
      reason: input.reason,
      status: "follow_up_requested",
    },
    dedupeKey: buildDedupeKey(["admin_follow_up", user.id, input.reason, new Date().toISOString().slice(0, 13)]),
  });
}
