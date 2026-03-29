import { AnalyticsEventType, FunnelStage, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export { AnalyticsEventType, FunnelStage };

export async function createAnalyticsEvent(input: {
  userId: string;
  eventType: AnalyticsEventType;
  metadata?: Prisma.InputJsonValue;
  createdAt?: Date;
}) {
  return prisma.analyticsEvent.create({
    data: {
      userId: input.userId,
      eventType: input.eventType,
      metadata: input.metadata ?? {},
      createdAt: input.createdAt ?? new Date(),
    },
  });
}

export async function findAnalyticsEventByType(userId: string, eventType: AnalyticsEventType) {
  return prisma.analyticsEvent.findFirst({
    where: { userId, eventType },
    orderBy: { createdAt: "asc" },
  });
}

export async function updateUserFunnelStage(userId: string, stage: FunnelStage) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      funnelStage: stage,
      funnelUpdatedAt: new Date(),
    },
  });
}

export async function listAnalyticsEvents() {
  return prisma.analyticsEvent.findMany({
    orderBy: { createdAt: "asc" },
  });
}

export async function listClientUsersForAnalytics() {
  return prisma.user.findMany({
    where: {
      userType: "client",
      deletedAt: null,
    },
    select: {
      id: true,
      createdAt: true,
      funnelStage: true,
      funnelUpdatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getClientUserAnalyticsById(userId: string) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      userType: "client",
      deletedAt: null,
    },
    select: {
      id: true,
      funnelStage: true,
      funnelUpdatedAt: true,
      createdAt: true,
    },
  });
}
