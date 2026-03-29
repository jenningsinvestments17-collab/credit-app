import { prisma } from "@/lib/db/prisma";
import type { DisputeStrategyOutput } from "@/lib/types";

export async function storeDisputeStrategyOutput(input: {
  disputeVersionId?: string;
  leadId: string;
  strategy: DisputeStrategyOutput;
}) {
  const scoreRecord = await prisma.disputeScore.create({
    data: {
      disputeVersionId: input.disputeVersionId ?? null,
      leadId: input.leadId,
      version: input.strategy.caseScore.version,
      totalScore: input.strategy.caseScore.totalScore,
      highSeverityCount: input.strategy.caseScore.highSeverityCount,
      criticalCount: input.strategy.caseScore.criticalCount,
      classification: input.strategy.caseScore.classification,
    },
  });

  if (input.strategy.escalation.flags.length) {
    await prisma.escalationFlag.createMany({
      data: input.strategy.escalation.flags.map((flag) => ({
        disputeVersionId: input.disputeVersionId ?? null,
        leadId: input.leadId,
        tier: input.strategy.escalation.tier,
        flagType: flag.type,
        title: flag.title,
        reason: flag.reason,
        weight: flag.weight,
        tone: input.strategy.escalation.tone,
        includeStatutes: input.strategy.escalation.includeStatutes,
        claimPreservation: input.strategy.escalation.claimPreservation,
        metadata: {
          escalationRecommendation: input.strategy.escalation.escalationRecommendation,
        },
      })),
    });
  }

  return scoreRecord;
}
