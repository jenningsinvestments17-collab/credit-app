import { prisma } from "@/lib/db/prisma";
import type { DisputeStrategyOutput } from "@/lib/types";

export async function storeDisputeStrategyOutput(input: {
  disputeVersionId?: string;
  leadId: string;
  strategyOutput: DisputeStrategyOutput;
}) {
  const { caseScore, escalation } = input.strategyOutput;

  const scoreRecord = await prisma.disputeScore.create({
    data: {
      disputeVersionId: input.disputeVersionId ?? null,
      leadId: input.leadId,
      version: caseScore.version,
      totalScore: caseScore.totalScore,
      highSeverityCount: caseScore.highSeverityCount,
      criticalCount: caseScore.criticalCount,
      classification: caseScore.classification,
      metadata: {
        findings: caseScore.findings.map((finding) => ({
          defectCode: finding.defectCode,
          accountKey: finding.accountKey,
          accountName: finding.accountName,
          severity: finding.severity,
          confidence: finding.confidence,
          severityPoints: finding.severityPoints,
          confidenceMultiplier: finding.confidenceMultiplier,
          evidenceBonus: finding.evidenceBonus,
          totalScore: finding.totalScore,
        })),
      },
    },
  });

  const flagRecords = escalation.flags.length
    ? await prisma.escalationFlag.createMany({
        data: escalation.flags.map((flag) => ({
          disputeVersionId: input.disputeVersionId ?? null,
          leadId: input.leadId,
          tier: escalation.tier,
          flagType: flag.type,
          title: flag.title,
          reason: flag.reason,
          weight: flag.weight,
          tone: escalation.tone,
          includeStatutes: escalation.includeStatutes,
          claimPreservation: escalation.claimPreservation,
          metadata: {
            escalationRecommendation: escalation.escalationRecommendation,
          },
        })),
      })
    : { count: 0 };

  return {
    scoreRecord,
    flagCount: flagRecords.count,
  };
}
