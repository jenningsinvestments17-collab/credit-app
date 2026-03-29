import { AnalyticsEventType, FunnelStage, type DashboardPaymentStatus } from "@prisma/client";
import { listAnalyticsEvents, listClientUsersForAnalytics } from "@/lib/db/analytics";
import { listDashboardPayments } from "@/lib/db/dashboardPayments";

const FUNNEL_STEPS = [
  { key: FunnelStage.intake_started, label: "Intake" },
  { key: FunnelStage.documents_uploaded, label: "Docs" },
  { key: FunnelStage.ai_generated, label: "AI" },
  { key: FunnelStage.dispute_approved, label: "Approved" },
  { key: FunnelStage.payment_completed, label: "Paid" },
  { key: FunnelStage.mail_sent, label: "Mailed" },
] as const;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const copy = startOfDay(date);
  const day = copy.getDay();
  const diff = (day + 6) % 7;
  copy.setDate(copy.getDate() - diff);
  return copy;
}

function hoursSince(date: Date) {
  return Math.round(((Date.now() - date.getTime()) / (1000 * 60 * 60)) * 10) / 10;
}

function statusLabel(status: DashboardPaymentStatus) {
  return status.replaceAll("_", " ");
}

export async function buildAdminProfitDashboard() {
  const [payments, users, events] = await Promise.all([
    listDashboardPayments(),
    listClientUsersForAnalytics(),
    listAnalyticsEvents(),
  ]);

  const now = new Date();
  const dayStart = startOfDay(now);
  const weekStart = startOfWeek(now);

  const capturedPayments = payments.filter((payment) => payment.status === "captured" && payment.capturedAt);
  const revenueTodayCents = capturedPayments
    .filter((payment) => payment.capturedAt && payment.capturedAt >= dayStart)
    .reduce((sum, payment) => sum + payment.amountCents, 0);
  const revenueWeekCents = capturedPayments
    .filter((payment) => payment.capturedAt && payment.capturedAt >= weekStart)
    .reduce((sum, payment) => sum + payment.amountCents, 0);

  const pendingStatuses: DashboardPaymentStatus[] = [
    "payment_required",
    "authorized",
    "authorization_expired",
    "payment_failed",
  ];
  const pendingPayments = payments.filter((payment) => pendingStatuses.includes(payment.status));
  const pendingPaymentCount = pendingPayments.length;

  const conversionRate = users.length
    ? Math.round((capturedPayments.length / users.length) * 1000) / 10
    : 0;

  const accountCreatedByUser = new Map<string, Date>();
  for (const event of events) {
    if (event.eventType === AnalyticsEventType.account_created && !accountCreatedByUser.has(event.userId)) {
      accountCreatedByUser.set(event.userId, event.createdAt);
    }
  }
  const paymentDurations = capturedPayments
    .map((payment) => {
      const createdAt = payment.userId ? accountCreatedByUser.get(payment.userId) : undefined;
      return createdAt && payment.capturedAt
        ? (payment.capturedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
        : null;
    })
    .filter((value): value is number => value !== null && value >= 0);
  const avgHoursToPayment = paymentDurations.length
    ? Math.round((paymentDurations.reduce((sum, value) => sum + value, 0) / paymentDurations.length) * 10) / 10
    : null;

  const uniqueUsersFor = (stage: FunnelStage) =>
    new Set(
      users
        .filter((user) => user.funnelStage === stage || events.some((event) => event.userId === user.id && event.eventType === stageToEvent(stage)))
        .map((user) => user.id),
    ).size;

  const funnel = FUNNEL_STEPS.map((step, index) => {
    const reached = uniqueUsersFor(step.key);
    const previous = index === 0 ? users.length : uniqueUsersFor(FUNNEL_STEPS[index - 1].key);
    const dropOffPercentage = previous ? Math.max(0, 100 - Math.round((reached / previous) * 100)) : 0;

    return {
      step: step.key,
      label: step.label,
      users: reached,
      dropOffPercentage,
    };
  });

  const revenueQueue = pendingPayments
    .map((payment) => ({
      disputeId: payment.disputeId,
      leadId: payment.leadId,
      userId: payment.userId,
      userName: payment.user
        ? `${payment.user.firstName} ${payment.user.lastName}`.trim()
        : "Client",
      userEmail: payment.user?.email ?? "",
      amountCents: payment.amountCents,
      status: payment.status,
      waitingHours: hoursSince(payment.requestedAt),
      requestedAt: payment.requestedAt.toISOString(),
    }))
    .sort((a, b) => b.waitingHours - a.waitingHours);

  const missingDocsAlerts = users
    .filter((user) => user.funnelStage === FunnelStage.intake_started && user.funnelUpdatedAt)
    .filter((user) => user.funnelUpdatedAt && hoursSince(user.funnelUpdatedAt) > 72)
    .map((user) => ({
      type: "missing_docs",
      userId: user.id,
      label: "Missing docs > 72h",
      waitingHours: hoursSince(user.funnelUpdatedAt!),
    }));

  const unpaidAlerts = pendingPayments
    .filter((payment) => hoursSince(payment.requestedAt) > 48)
    .map((payment) => ({
      type: "unpaid",
      disputeId: payment.disputeId,
      leadId: payment.leadId,
      label: "Unpaid > 48h",
      waitingHours: hoursSince(payment.requestedAt),
      status: statusLabel(payment.status),
    }));

  const failedPaymentAlerts = payments
    .filter((payment) => payment.status === "payment_failed" || payment.status === "authorization_expired")
    .map((payment) => ({
      type: "failed_payment",
      disputeId: payment.disputeId,
      leadId: payment.leadId,
      label: "Failed payment",
      status: statusLabel(payment.status),
      reason: payment.lastFailureReason ?? "Payment requires follow-up.",
    }));

  const stalledCaseAlerts = users
    .filter((user) =>
      user.funnelStage &&
      (
        user.funnelStage === FunnelStage.ai_generated ||
        user.funnelStage === FunnelStage.dispute_approved ||
        user.funnelStage === FunnelStage.payment_completed
      ) &&
      user.funnelUpdatedAt &&
      hoursSince(user.funnelUpdatedAt) > 72,
    )
    .map((user) => ({
      type: "stalled_case",
      userId: user.id,
      label: "Stalled case",
      stage: user.funnelStage!,
      waitingHours: hoursSince(user.funnelUpdatedAt!),
    }));

  const revenueSeries = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(dayStart);
    day.setDate(day.getDate() - (6 - index));
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    const totalCents = capturedPayments
      .filter((payment) => payment.capturedAt && payment.capturedAt >= day && payment.capturedAt < nextDay)
      .reduce((sum, payment) => sum + payment.amountCents, 0);

    return {
      label: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      totalCents,
    };
  });

  const conversionTrend = Array.from({ length: 6 }, (_, index) => {
    const weekStart = startOfWeek(new Date(now));
    weekStart.setDate(weekStart.getDate() - (7 * (5 - index)));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const createdUsers = events
      .filter((event) => event.eventType === AnalyticsEventType.account_created && event.createdAt >= weekStart && event.createdAt < weekEnd)
      .map((event) => event.userId);
    const paidUsers = new Set(
      events
        .filter((event) => event.eventType === AnalyticsEventType.payment_completed && event.createdAt >= weekStart && event.createdAt < weekEnd)
        .map((event) => event.userId),
    );
    const conversion = createdUsers.length
      ? Math.round((new Set(createdUsers.filter((id) => paidUsers.has(id))).size / new Set(createdUsers).size) * 1000) / 10
      : 0;

    return {
      label: `W${index + 1}`,
      conversionRate: conversion,
    };
  });

  return {
    revenueTodayCents,
    revenueWeekCents,
    pendingPaymentCount,
    conversionRate,
    avgHoursToPayment,
    funnel,
    revenueQueue,
    alerts: {
      unpaid: unpaidAlerts,
      missingDocs: missingDocsAlerts,
      failedPayments: failedPaymentAlerts,
      stalledCases: stalledCaseAlerts,
    },
    revenueSeries,
    conversionTrend,
  };
}

function stageToEvent(stage: FunnelStage): AnalyticsEventType {
  switch (stage) {
    case FunnelStage.intake_started:
      return AnalyticsEventType.intake_started;
    case FunnelStage.documents_uploaded:
      return AnalyticsEventType.documents_uploaded;
    case FunnelStage.ai_generated:
      return AnalyticsEventType.ai_generated;
    case FunnelStage.dispute_approved:
      return AnalyticsEventType.dispute_approved;
    case FunnelStage.payment_completed:
      return AnalyticsEventType.payment_completed;
    case FunnelStage.mail_sent:
      return AnalyticsEventType.mail_sent;
    case FunnelStage.account_created:
    default:
      return AnalyticsEventType.account_created;
  }
}
