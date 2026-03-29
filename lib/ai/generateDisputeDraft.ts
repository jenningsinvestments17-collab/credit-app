import { renderDisputeTemplate } from "@/lib/templates/disputeTemplate";
import { getAIReadiness, prepareDefectFindings, redactSensitiveValue } from "@/lib/ai/review";
import { buildStructuredGeneratorInput, getStrategyLabel } from "@/lib/ai/strategy";
import { analyzeViolations } from "@/lib/ai/violationEngine";
import { logViolationAnalysis } from "@/lib/db/violations";
import { storeDisputeStrategyOutput } from "@/lib/db/disputeScoring";
import { scoreCaseFindings } from "@/lib/ai/scoring";
import { buildDisputeStrategyOutput } from "@/lib/ai/escalation";
import { buildEscalationPipeline } from "@/lib/disputes/escalationPipeline";
import { findUserByEmail } from "@/lib/db/auth";
import type { Bureau, DisputeDraft, Lead } from "@/lib/types";

export async function generateDisputeDraftForLead(lead: Lead): Promise<DisputeDraft | null> {
  const readiness = getAIReadiness(lead);

  if (!readiness.ready) {
    return null;
  }

  const findings = prepareDefectFindings(lead);
  const bureau: Bureau = "Experian";
  const bureauFindings = findings.filter((item) => item.bureau === bureau);
  const bureauTradelines = bureauFindings
    .map((item) => item.tradelineData)
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => ({
      ...item,
      bureau,
      accountName: item.accountName ?? item.furnisher ?? "Unknown account",
    }));
  const violationAnalysis = analyzeViolations({
    tradelines: bureauTradelines,
    version: 1,
  });
  const caseScore = scoreCaseFindings({
    findings: bureauFindings,
    version: 1,
  });
  const strategyOutput = buildDisputeStrategyOutput({
    caseScore,
    currentFindings: bureauFindings,
  });
  const disputeId = `dispute_${lead.id}`;
  const pipeline = buildEscalationPipeline({
    disputeId,
    leadId: lead.id,
    strategyOutput,
    findings: bureauFindings,
    violationAnalysis,
  });
  const structuredInput = buildStructuredGeneratorInput(violationAnalysis);
  const user = await findUserByEmail(lead.email);

  await logViolationAnalysis({
    userId: user?.id,
    leadId: lead.id,
    bureau,
    analysis: violationAnalysis,
  });
  await storeDisputeStrategyOutput({
    leadId: lead.id,
    strategyOutput: {
      ...strategyOutput,
      pipeline,
    },
  });

  return {
    bureau,
    generatedAt: new Date().toISOString(),
    status: "awaiting_admin_review",
    summary:
      `Draft dispute prepared from structured tradelines, mapped defect-code logic, ${getStrategyLabel(violationAnalysis.strategy).toLowerCase()}, and a ${strategyOutput.escalation.tier.replaceAll("_", " ")} escalation posture based on the current file.`,
    letterText: renderDisputeTemplate({
      lead,
      bureauName: bureau,
      findings: bureauFindings.map((item) => ({
        ...item,
        accountLast4: redactSensitiveValue(item.accountLast4),
        })),
    }),
    findings: bureauFindings,
    violationAnalysis,
    strategyOutput: {
      ...strategyOutput,
      pipeline,
    },
    modelInputNotes: [
      "Used the stored dispute template from the main project root.",
      "Passed structured violation data and strategy into the generator without raw PII.",
      `Structured strategy input version ${structuredInput.version} with ${structuredInput.violations.length} violation signals.`,
      `Case score ${strategyOutput.caseScore.totalScore} classified as ${strategyOutput.caseScore.classification}.`,
      `Escalation tier ${strategyOutput.escalation.tier} with tone ${strategyOutput.escalation.tone}.`,
      `Escalation stage ${pipeline.stage.replaceAll("_", " ")} assigned with deterministic claim-packet output.`,
      strategyOutput.escalation.includeStatutes
        ? "Include statutes in the assembled dispute narrative."
        : "Keep the dispute narrative factual without statute-heavy escalation.",
      strategyOutput.escalation.claimPreservation
        ? "Preserve claim language and escalation history for follow-up if the file remains inaccurate."
        : "No claim-preservation language required at this stage.",
      "Mapped findings into allowed dispute codes from your template before rendering.",
      "Prepared as a draft only for admin review. No auto-send behavior.",
    ],
  };
}
