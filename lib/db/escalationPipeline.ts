import { prisma } from "@/lib/db/prisma";
import type {
  ClaimPacket,
  EscalationHistoryRecord,
  EscalationStage,
} from "@/lib/types";

export async function storeClaimPacket(input: {
  disputeId: string;
  disputeVersionId?: string;
  leadId: string;
  packet: ClaimPacket;
}) {
  return prisma.claimPacket.create({
    data: {
      disputeId: input.disputeId,
      disputeVersionId: input.disputeVersionId ?? null,
      leadId: input.leadId,
      stage: input.packet.stage,
      caseSummary: input.packet.caseSummary,
      violationSummary: input.packet.violationSummary,
      timeline: input.packet.timeline,
      evidenceList: input.packet.evidenceList,
      neutralLegalMapping: input.packet.neutralLegalMapping,
      requestedOutcome: input.packet.requestedOutcome,
      escalationLetter: input.packet.escalationLetter,
      claimPacketText: input.packet.claimPacketText,
      claimPacketPdfPath: input.packet.claimPacketPdfPath ?? null,
      exportBundlePath: input.packet.exportBundlePath ?? null,
    },
  });
}

export async function appendEscalationHistory(input: {
  disputeId: string;
  disputeVersionId?: string;
  leadId: string;
  fromStage?: EscalationStage;
  toStage: EscalationStage;
  actorType: "system" | "admin";
  actorId: string;
  reason: string;
  overrideApplied?: boolean;
}) {
  return prisma.escalationHistory.create({
    data: {
      disputeId: input.disputeId,
      disputeVersionId: input.disputeVersionId ?? null,
      leadId: input.leadId,
      fromStage: input.fromStage ?? null,
      toStage: input.toStage,
      actorType: input.actorType,
      actorId: input.actorId,
      reason: input.reason,
      overrideApplied: input.overrideApplied ?? false,
    },
  });
}

export async function listEscalationHistory(disputeId: string): Promise<EscalationHistoryRecord[]> {
  const rows = await prisma.escalationHistory.findMany({
    where: { disputeId },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    disputeId: row.disputeId,
    disputeVersionId: row.disputeVersionId ?? undefined,
    leadId: row.leadId,
    fromStage: (row.fromStage as EscalationStage | null) ?? undefined,
    toStage: row.toStage as EscalationStage,
    actorType: row.actorType as "system" | "admin",
    actorId: row.actorId,
    reason: row.reason,
    overrideApplied: row.overrideApplied,
    createdAt: row.createdAt.toISOString(),
  }));
}
