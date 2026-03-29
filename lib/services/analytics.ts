import { AnalyticsEventType, FunnelStage, type Prisma } from "@prisma/client";
import {
  createAnalyticsEvent,
  findAnalyticsEventByType,
  getClientUserAnalyticsById,
  listAnalyticsEvents,
  listClientUsersForAnalytics,
  updateUserFunnelStage,
} from "@/lib/db/analytics";
import { findUserByEmail } from "@/lib/db/auth";
import { queueIntakeIncompleteNotifications } from "@/lib/services/notifications";
import type { Lead, PaymentRecord } from "@/lib/types";

const STAGE_ORDER: FunnelStage[] = [
  FunnelStage.account_created,
  FunnelStage.intake_started,
  FunnelStage.documents_uploaded,
  FunnelStage.ai_generated,
  FunnelStage.dispute_approved,
  FunnelStage.payment_completed,
  FunnelStage.mail_sent,
];

function sanitizeMetadata(value: unknown): unknown {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeMetadata(item))
      .filter((item) => item !== undefined);
  }

  if (typeof value === "object") {
    const blockedKeys = new Set([
      "email",
      "fullName",
      "firstName",
      "lastName",
      "phone",
      "address",
      "street",
      "street1",
      "street2",
      "postalCode",
      "zip",
      "ssn",
      "dob",
      "password",
      "token",
      "resetToken",
      "verificationToken",
      "parsedText",
      "letterText",
    ]);

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !blockedKeys.has(key))
        .map(([key, nested]) => [key, sanitizeMetadata(nested)])
        .filter(([, nested]) => nested !== undefined),
    );
  }

  if (typeof value === "string") {
    return value.slice(0, 200);
  }

  return value;
}

function shouldAdvanceStage(currentStage: FunnelStage | null | undefined, nextStage: FunnelStage) {
  const currentIndex = currentStage ? STAGE_ORDER.indexOf(currentStage) : -1;
  const nextIndex = STAGE_ORDER.indexOf(nextStage);
  return nextIndex > currentIndex;
}

export async function trackAnalyticsEvent(input: {
  userId: string;
  eventType: AnalyticsEventType;
  stage: FunnelStage;
  metadata?: Record<string, unknown>;
  dedupe?: boolean;
}) {
  if (input.dedupe) {
    const existing = await findAnalyticsEventByType(input.userId, input.eventType);
    if (existing) {
      const currentUser = await getClientUserAnalyticsById(input.userId);
      if (shouldAdvanceStage(currentUser?.funnelStage, input.stage)) {
        await updateUserFunnelStage(input.userId, input.stage);
      }
      return existing;
    }
  }

  const event = await createAnalyticsEvent({
    userId: input.userId,
    eventType: input.eventType,
    metadata: (sanitizeMetadata(input.metadata) ?? {}) as Prisma.InputJsonValue,
  });

  const user = await getClientUserAnalyticsById(input.userId);
  if (shouldAdvanceStage(user?.funnelStage, input.stage)) {
    await updateUserFunnelStage(input.userId, input.stage);
  }

  return event;
}

export async function trackAccountCreated(userId: string, metadata?: Record<string, unknown>) {
  return trackAnalyticsEvent({
    userId,
    eventType: AnalyticsEventType.account_created,
    stage: FunnelStage.account_created,
    metadata,
    dedupe: true,
  });
}

export async function trackIntakeStartedForLead(lead: Lead) {
  const user = await findUserByEmail(lead.email);
  if (!user) {
    return null;
  }

  const event = await trackAnalyticsEvent({
    userId: user.id,
    eventType: AnalyticsEventType.intake_started,
    stage: FunnelStage.intake_started,
    metadata: {
      leadId: lead.id,
      leadStatus: lead.leadStatus,
      reportReadiness: lead.reportReadiness,
    },
    dedupe: true,
  });

  if (lead.intakeStatus !== "completed") {
    await queueIntakeIncompleteNotifications({
      userId: user.id,
      lead,
    });
  }

  return event;
}

export async function trackDocumentsUploadedForLead(input: {
  lead: Lead;
  documentKey: string;
  bureau?: string;
  parseStatus: string;
  extractionStrategy?: string;
  tradelineCount?: number;
}) {
  const user = await findUserByEmail(input.lead.email);
  if (!user) {
    return null;
  }

  return trackAnalyticsEvent({
    userId: user.id,
    eventType: AnalyticsEventType.documents_uploaded,
    stage: FunnelStage.documents_uploaded,
    metadata: {
      leadId: input.lead.id,
      documentKey: input.documentKey,
      bureau: input.bureau,
      parseStatus: input.parseStatus,
      extractionStrategy: input.extractionStrategy,
      tradelineCount: input.tradelineCount ?? 0,
    },
  });
}

export async function trackAiGeneratedForLead(lead: Lead, metadata?: Record<string, unknown>) {
  const user = await findUserByEmail(lead.email);
  if (!user) {
    return null;
  }

  return trackAnalyticsEvent({
    userId: user.id,
    eventType: AnalyticsEventType.ai_generated,
    stage: FunnelStage.ai_generated,
    metadata: {
      leadId: lead.id,
      ...metadata,
    },
  });
}

export async function trackDisputeApprovedForLead(lead: Lead, metadata?: Record<string, unknown>) {
  const user = await findUserByEmail(lead.email);
  if (!user) {
    return null;
  }

  return trackAnalyticsEvent({
    userId: user.id,
    eventType: AnalyticsEventType.dispute_approved,
    stage: FunnelStage.dispute_approved,
    metadata: {
      leadId: lead.id,
      ...metadata,
    },
  });
}

export async function trackPaymentCompletedByEmail(
  email: string,
  payment: PaymentRecord,
  metadata?: Record<string, unknown>,
) {
  const user = await findUserByEmail(email);
  if (!user) {
    return null;
  }

  return trackAnalyticsEvent({
    userId: user.id,
    eventType: AnalyticsEventType.payment_completed,
    stage: FunnelStage.payment_completed,
    metadata: {
      disputeId: payment.disputeId,
      amountCents: payment.amountCents,
      currency: payment.currency,
      retryCount: payment.retryCount ?? 0,
      ...metadata,
    },
  });
}

export async function trackMailSentForLead(lead: Lead, metadata?: Record<string, unknown>) {
  const user = await findUserByEmail(lead.email);
  if (!user) {
    return null;
  }

  return trackAnalyticsEvent({
    userId: user.id,
    eventType: AnalyticsEventType.mail_sent,
    stage: FunnelStage.mail_sent,
    metadata: {
      leadId: lead.id,
      ...metadata,
    },
  });
}

type AnalyticsStepMetric = {
  eventType: AnalyticsEventType;
  label: string;
  users: number;
  conversionRate: number;
  dropOffRate: number;
};

export async function buildAnalyticsDashboardModel() {
  const [users, events] = await Promise.all([
    listClientUsersForAnalytics(),
    listAnalyticsEvents(),
  ]);

  const totalUsers = users.length;
  const uniqueUsersFor = (eventType: AnalyticsEventType) =>
    new Set(events.filter((event) => event.eventType === eventType).map((event) => event.userId)).size;

  const orderedSteps: { eventType: AnalyticsEventType; label: string }[] = [
    { eventType: AnalyticsEventType.account_created, label: "Account created" },
    { eventType: AnalyticsEventType.intake_started, label: "Intake started" },
    { eventType: AnalyticsEventType.documents_uploaded, label: "Documents uploaded" },
    { eventType: AnalyticsEventType.ai_generated, label: "AI generated" },
    { eventType: AnalyticsEventType.dispute_approved, label: "Dispute approved" },
    { eventType: AnalyticsEventType.payment_completed, label: "Payment completed" },
    { eventType: AnalyticsEventType.mail_sent, label: "Mail sent" },
  ];

  const funnel = orderedSteps.map((step, index) => {
    const usersAtStep = uniqueUsersFor(step.eventType);
    const previousUsers = index === 0 ? totalUsers || usersAtStep : uniqueUsersFor(orderedSteps[index - 1].eventType);
    const conversionRate = totalUsers ? Math.round((usersAtStep / totalUsers) * 100) : 0;
    const dropOffRate = previousUsers ? Math.max(0, 100 - Math.round((usersAtStep / previousUsers) * 100)) : 0;

    return {
      eventType: step.eventType,
      label: step.label,
      users: usersAtStep,
      conversionRate,
      dropOffRate,
    } satisfies AnalyticsStepMetric;
  });

  const paymentEvents = events.filter((event) => event.eventType === AnalyticsEventType.payment_completed);
  const revenueCents = paymentEvents.reduce((sum, event) => {
    const amount = typeof (event.metadata as Record<string, unknown>)?.amountCents === "number"
      ? ((event.metadata as Record<string, unknown>).amountCents as number)
      : 0;
    return sum + amount;
  }, 0);

  const accountCreatedMap = new Map<string, Date>();
  const mailSentMap = new Map<string, Date>();
  for (const event of events) {
    if (event.eventType === AnalyticsEventType.account_created && !accountCreatedMap.has(event.userId)) {
      accountCreatedMap.set(event.userId, event.createdAt);
    }
    if (event.eventType === AnalyticsEventType.mail_sent && !mailSentMap.has(event.userId)) {
      mailSentMap.set(event.userId, event.createdAt);
    }
  }

  const durationsHours = Array.from(accountCreatedMap.entries())
    .map(([userId, accountCreatedAt]) => {
      const mailedAt = mailSentMap.get(userId);
      return mailedAt ? (mailedAt.getTime() - accountCreatedAt.getTime()) / (1000 * 60 * 60) : null;
    })
    .filter((value): value is number => value !== null && value >= 0);

  const avgHoursToCompletion = durationsHours.length
    ? Math.round((durationsHours.reduce((sum, value) => sum + value, 0) / durationsHours.length) * 10) / 10
    : null;

  return {
    totalUsers,
    funnel,
    revenueCents,
    paymentsCompleted: paymentEvents.length,
    avgHoursToCompletion,
    currentStageCounts: STAGE_ORDER.map((stage) => ({
      stage,
      users: users.filter((user) => user.funnelStage === stage).length,
    })),
  };
}
