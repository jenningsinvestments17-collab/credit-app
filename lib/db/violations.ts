import { prisma } from "@/lib/db/prisma";
import type { ViolationAnalysis } from "@/lib/types";

export async function logViolationAnalysis(input: {
  userId?: string | null;
  leadId: string;
  disputeId?: string;
  disputeVersionId?: string;
  bureau: string;
  analysis: ViolationAnalysis;
}) {
  if (!input.analysis.violations.length) {
    return [];
  }

  await prisma.violationLog.createMany({
    data: input.analysis.violations.map((violation) => ({
      userId: input.userId ?? null,
      leadId: input.leadId,
      disputeId: input.disputeId ?? null,
      disputeVersionId: input.disputeVersionId ?? null,
      bureau: violation.bureau ?? input.bureau,
      violationType: violation.type,
      law: violation.law,
      score: violation.score,
      confidence: violation.confidence,
      strategy: input.analysis.strategy,
      resultVersion: input.analysis.version,
      accountKey: violation.accountKey,
      accountName: violation.accountName,
      metadata: {
        explanation: violation.explanation,
        supportingFacts: violation.supportingFacts,
        overallStrength: input.analysis.overallStrength,
        violationSummary: input.analysis.violationSummary,
        recommendedNextSteps: input.analysis.recommendedNextSteps,
      },
    })),
  });

  return input.analysis.violations;
}
