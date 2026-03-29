import { prisma } from "@/lib/db/prisma";

type UpsertWebhookEventInput = {
  provider: string;
  eventId?: string | null;
  eventType: string;
  disputeId?: string | null;
  leadId?: string | null;
  signatureValid: boolean;
  payload?: Record<string, unknown>;
  status?: string;
  errorMessage?: string | null;
  processedAt?: Date | null;
};

export async function findWebhookEventByEventId(provider: string, eventId: string) {
  return prisma.webhookEvent.findFirst({
    where: {
      provider,
      eventId,
    },
  });
}

export async function upsertWebhookEvent(input: UpsertWebhookEventInput) {
  if (input.eventId) {
    return prisma.webhookEvent.upsert({
      where: {
        eventId: input.eventId,
      },
      create: {
        provider: input.provider,
        eventId: input.eventId,
        eventType: input.eventType,
        disputeId: input.disputeId ?? null,
        leadId: input.leadId ?? null,
        signatureValid: input.signatureValid,
        payload: input.payload ?? {},
        status: input.status ?? "received",
        errorMessage: input.errorMessage ?? null,
        processedAt: input.processedAt ?? null,
        attempts: 1,
      },
      update: {
        eventType: input.eventType,
        disputeId: input.disputeId ?? null,
        leadId: input.leadId ?? null,
        signatureValid: input.signatureValid,
        payload: input.payload ?? {},
        status: input.status ?? "received",
        errorMessage: input.errorMessage ?? null,
        processedAt: input.processedAt ?? null,
        attempts: {
          increment: 1,
        },
      },
    });
  }

  return prisma.webhookEvent.create({
    data: {
      provider: input.provider,
      eventType: input.eventType,
      disputeId: input.disputeId ?? null,
      leadId: input.leadId ?? null,
      signatureValid: input.signatureValid,
      payload: input.payload ?? {},
      status: input.status ?? "received",
      errorMessage: input.errorMessage ?? null,
      processedAt: input.processedAt ?? null,
      attempts: 1,
    },
  });
}
