import { prisma } from "@/lib/db/prisma";
import { listDefectCodeDefinitions } from "@/lib/ai/defectCodes";
import type { DefectFinding } from "@/lib/types";

export async function syncDefectCodeCatalog() {
  const catalog = listDefectCodeDefinitions();
  await Promise.all(
    catalog.map((definition) =>
      prisma.defectCodeCatalog.upsert({
        where: { code: definition.code },
        create: {
          code: definition.code,
          title: definition.title,
          category: definition.category,
          severity: definition.severity,
          laws: definition.laws,
          description: definition.description,
          consumerHarm: definition.consumerHarm,
          disputeGoal: definition.disputeGoal,
          suggestedTone: definition.suggestedTone,
          strategyLevel: definition.strategyLevel,
          outputTemplateKey: definition.outputTemplateKey,
          escalationReady: definition.escalationReady,
        },
        update: {
          title: definition.title,
          category: definition.category,
          severity: definition.severity,
          laws: definition.laws,
          description: definition.description,
          consumerHarm: definition.consumerHarm,
          disputeGoal: definition.disputeGoal,
          suggestedTone: definition.suggestedTone,
          strategyLevel: definition.strategyLevel,
          outputTemplateKey: definition.outputTemplateKey,
          escalationReady: definition.escalationReady,
        },
      }),
    ),
  );
}

export async function storeDisputeDefectFindings(input: {
  disputeVersionId?: string;
  leadId: string;
  findings: DefectFinding[];
}) {
  if (!input.findings.length) {
    return [];
  }

  await syncDefectCodeCatalog();

  await prisma.disputeDefectFinding.createMany({
    data: input.findings.map((finding) => ({
      disputeVersionId: input.disputeVersionId ?? null,
      leadId: input.leadId,
      bureau: finding.bureau,
      accountKey: finding.accountKey,
      accountName: finding.accountName,
      accountLast4: finding.accountLast4,
      defectCode: finding.defectCode,
      confidence: finding.confidence,
      score: finding.score,
      supportingFacts: finding.supportingFacts,
      metadata: {
        title: finding.title,
        category: finding.category,
        severity: finding.severity,
        laws: finding.laws,
        reason: finding.reason,
        consumerHarm: finding.consumerHarm,
        disputeGoal: finding.disputeGoal,
        suggestedTone: finding.suggestedTone,
        strategyLevel: finding.strategyLevel,
        outputTemplateKey: finding.outputTemplateKey,
        escalationReady: finding.escalationReady,
        disputeCodes: finding.disputeCodes ?? [],
      },
    })),
  });

  return input.findings;
}
