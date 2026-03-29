import { DashboardPaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function upsertDashboardPayment(input: {
  userId?: string | null;
  leadId: string;
  disputeId: string;
  amountCents: number;
  currency: string;
  status: DashboardPaymentStatus;
  requestedAt: Date;
  authorizedAt?: Date | null;
  capturedAt?: Date | null;
  serviceRenderedAt?: Date | null;
  lastFailureReason?: string | null;
  checkoutSessionId?: string | null;
  paymentIntentId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  return prisma.dashboardPayment.upsert({
    where: { disputeId: input.disputeId },
    create: {
      userId: input.userId ?? null,
      leadId: input.leadId,
      disputeId: input.disputeId,
      amountCents: input.amountCents,
      currency: input.currency,
      status: input.status,
      requestedAt: input.requestedAt,
      authorizedAt: input.authorizedAt ?? null,
      capturedAt: input.capturedAt ?? null,
      serviceRenderedAt: input.serviceRenderedAt ?? null,
      lastFailureReason: input.lastFailureReason ?? null,
      checkoutSessionId: input.checkoutSessionId ?? null,
      paymentIntentId: input.paymentIntentId ?? null,
      metadata: input.metadata ?? {},
    },
    update: {
      userId: input.userId ?? null,
      leadId: input.leadId,
      amountCents: input.amountCents,
      currency: input.currency,
      status: input.status,
      requestedAt: input.requestedAt,
      authorizedAt: input.authorizedAt ?? null,
      capturedAt: input.capturedAt ?? null,
      serviceRenderedAt: input.serviceRenderedAt ?? null,
      lastFailureReason: input.lastFailureReason ?? null,
      checkoutSessionId: input.checkoutSessionId ?? null,
      paymentIntentId: input.paymentIntentId ?? null,
      metadata: input.metadata ?? {},
    },
  });
}

export async function listDashboardPayments() {
  return prisma.dashboardPayment.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });
}

export { DashboardPaymentStatus };
