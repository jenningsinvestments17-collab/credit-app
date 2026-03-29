import { getLeadById } from "@/lib/leads";
import { DOMAIN_EVENT_NAMES } from "@/lib/events/eventNames";
import { storeDisputeDefectFindings } from "@/lib/db/defects";
import { storeDisputeStrategyOutput } from "@/lib/db/disputeScoring";
import { appendEscalationHistory, listEscalationHistory, storeClaimPacket } from "@/lib/db/escalationPipeline";
import { generateSimplePdfBuffer, renderDisputePdfContent } from "@/lib/pdf/generateDisputePdf";
import { applyWorkflowTransition } from "@/lib/workflows/applyTransition";
import { emitDomainEvent } from "@/lib/events/emit";
import { trackDisputeApprovedForLead } from "@/lib/services/analytics";
import { scoreCaseFindings } from "@/lib/ai/scoring";
import { buildDisputeStrategyOutput } from "@/lib/ai/escalation";
import { buildEscalationPipeline } from "@/lib/disputes/escalationPipeline";
import {
  appendMailingEvent,
  getDisputeById,
  getDisputeByLeadId,
  saveDisputeRecord,
  saveDisputeVersion,
} from "@/lib/disputes/repository";
import type {
  DisputeRecord,
  DisputeVersionRecord,
  EscalationStage,
  MailingWorkflowStatus,
  ViolationAnalysis,
  ViolationStrategy,
} from "@/lib/types";

function nowIso() {
  return new Date().toISOString();
}

function statusAfterApproval(): MailingWorkflowStatus {
  return applyWorkflowTransition({
    family: "mailing",
    fromStatus: "awaiting_admin_approval",
    toStatus: "approved_pending_pdf",
    context: {
      hasDisputeDraft: true,
      adminApproved: true,
    },
  }).nextStatus;
}

function resolveStrategyOutput(input: {
  disputeId: string;
  leadId: string;
  findings: DisputeVersionRecord["findings"];
  versionNumber: number;
  previousVersions?: Array<{ findings: DisputeVersionRecord["findings"] }>;
}) {
  const caseScore = scoreCaseFindings({
    findings: input.findings,
    version: input.versionNumber,
  });

  const strategyOutput = buildDisputeStrategyOutput({
    caseScore,
    currentFindings: input.findings,
    previousVersions: input.previousVersions,
    postDisputeFailure: input.versionNumber > 1,
  });

  const fallbackViolationAnalysis: ViolationAnalysis = {
    version: input.versionNumber,
    overallStrength: caseScore.totalScore,
    strategy:
      strategyOutput.escalation.tier === "basic"
        ? "basic_dispute"
        : strategyOutput.escalation.tier === "aggressive"
          ? "aggressive_dispute"
          : "dispute_with_legal_leverage",
    violationSummary: `Escalation review prepared from ${input.findings.length} defect finding(s).`,
    recommendedNextSteps: [strategyOutput.escalation.escalationRecommendation],
    violations: [],
  };

  const pipeline = buildEscalationPipeline({
    disputeId: input.disputeId,
    leadId: input.leadId,
    strategyOutput,
    findings: input.findings,
    violationAnalysis: fallbackViolationAnalysis,
  });

  return {
    ...strategyOutput,
    pipeline,
  };
}

function buildFallbackViolationAnalysisForEscalation(
  strategyOutput: ReturnType<typeof resolveStrategyOutput>,
  findings: DisputeVersionRecord["findings"],
  versionNumber: number,
): ViolationAnalysis {
  const strategy: ViolationStrategy =
    strategyOutput.escalation.tier === "basic"
      ? "basic_dispute"
      : strategyOutput.escalation.tier === "aggressive"
        ? "aggressive_dispute"
        : "dispute_with_legal_leverage";

  return {
    version: versionNumber,
    overallStrength: strategyOutput.caseScore.totalScore,
    strategy,
    violationSummary: `Escalation review prepared from ${findings.length} defect finding(s).`,
    recommendedNextSteps: [strategyOutput.escalation.escalationRecommendation],
    violations: [],
  };
}

export async function getDisputeWorkflowByLeadId(leadId: string) {
  return getDisputeByLeadId(leadId);
}

export async function getEscalationHistoryForDispute(disputeId: string) {
  return listEscalationHistory(disputeId);
}

export async function updateDisputeEscalationStage(input: {
  disputeId: string;
  actorId: string;
  mode: "advance" | "override";
  targetStage?: EscalationStage;
}) {
  const { dispute, currentVersion } = await getDisputeById(input.disputeId);
  if (!dispute || !currentVersion || !currentVersion.strategyOutput?.pipeline) {
    throw new Error("Dispute escalation data not found.");
  }

  const currentStage = dispute.escalationStage ?? currentVersion.strategyOutput.pipeline.stage;
  const fallbackViolationAnalysis = buildFallbackViolationAnalysisForEscalation(
    currentVersion.strategyOutput as ReturnType<typeof resolveStrategyOutput>,
    currentVersion.findings,
    currentVersion.versionNumber,
  );
  const targetStage =
    input.mode === "override"
      ? input.targetStage
      : currentVersion.strategyOutput.pipeline.recommendedNextStage;

  if (!targetStage) {
    throw new Error("No next escalation stage is available.");
  }

  const pipeline = buildEscalationPipeline({
    disputeId: dispute.id,
    leadId: dispute.leadId,
    strategyOutput: currentVersion.strategyOutput,
    findings: currentVersion.findings,
    violationAnalysis: fallbackViolationAnalysis,
    overrideStage: targetStage,
  });

  const nextVersion: DisputeVersionRecord = {
    ...currentVersion,
    id: `${dispute.id}_v${currentVersion.versionNumber + 1}`,
    versionNumber: currentVersion.versionNumber + 1,
    strategyOutput: {
      ...currentVersion.strategyOutput,
      pipeline,
    },
    generatedBy: "admin",
    createdAt: nowIso(),
    notes: [
      ...currentVersion.notes,
      input.mode === "override"
        ? `Escalation stage overridden to ${targetStage.replaceAll("_", " ")}.`
        : `Escalation advanced to ${targetStage.replaceAll("_", " ")}.`,
    ],
  };
  const nextStrategyOutput = nextVersion.strategyOutput!;

  const nextDispute: DisputeRecord = {
    ...dispute,
    currentVersionId: nextVersion.id,
    processingStatus: dispute.processingStatus,
    escalationStage: targetStage,
    escalationUpdatedAt: nextVersion.createdAt,
    updatedAt: nextVersion.createdAt,
  };

  await saveDisputeVersion(nextVersion);
  await saveDisputeRecord(nextDispute);
  await storeDisputeStrategyOutput({
    disputeVersionId: nextVersion.id,
    leadId: dispute.leadId,
    strategyOutput: nextStrategyOutput,
  });
  await storeClaimPacket({
    disputeId: dispute.id,
    disputeVersionId: nextVersion.id,
    leadId: dispute.leadId,
    packet: pipeline.claimPacket,
  });
  await appendEscalationHistory({
    disputeId: dispute.id,
    disputeVersionId: nextVersion.id,
    leadId: dispute.leadId,
    fromStage: currentStage,
    toStage: targetStage,
    actorType: "admin",
    actorId: input.actorId,
    reason: pipeline.stageReason,
    overrideApplied: input.mode === "override",
  });

  return { dispute: nextDispute, version: nextVersion };
}

export async function approveDisputeForMailing(disputeId: string, approvedBy = "Admin reviewer") {
  const { dispute, currentVersion, versions } = await getDisputeById(disputeId);
  if (!dispute || !currentVersion) {
    throw new Error("Dispute record not found.");
  }

  if (dispute.workflowStatus !== "awaiting_admin_approval") {
    return { dispute, version: currentVersion, alreadyApproved: true };
  }

  const approvedAt = nowIso();
  const strategyOutput = currentVersion.strategyOutput ?? resolveStrategyOutput({
    disputeId: dispute.id,
    leadId: dispute.leadId,
    findings: currentVersion.findings,
    versionNumber: currentVersion.versionNumber + 1,
    previousVersions: versions
      .filter((item) => item.id !== currentVersion.id)
      .map((item) => ({ findings: item.findings })),
  });
  const pipeline = strategyOutput.pipeline!;
  const version: DisputeVersionRecord = {
    ...currentVersion,
    id: `${dispute.id}_v${currentVersion.versionNumber + 1}`,
    versionNumber: currentVersion.versionNumber + 1,
    kind: "admin_approved",
    strategyOutput,
    generatedBy: "admin",
    approvedAt,
    createdAt: approvedAt,
    notes: [...currentVersion.notes, "Approved for mailing after admin review."],
  };

  const nextDispute: DisputeRecord = {
    ...dispute,
    currentVersionId: version.id,
    processingStatus: "approved",
    workflowStatus: statusAfterApproval(),
    escalationStage: pipeline.stage,
    escalationUpdatedAt: approvedAt,
    approvedAt,
    approvedBy,
    updatedAt: approvedAt,
  };

  await saveDisputeVersion(version);
  await storeDisputeDefectFindings({
    disputeVersionId: version.id,
    leadId: dispute.leadId,
    findings: version.findings,
  });
  await storeDisputeStrategyOutput({
    disputeVersionId: version.id,
    leadId: dispute.leadId,
    strategyOutput,
  });
  await storeClaimPacket({
    disputeId,
    disputeVersionId: version.id,
    leadId: dispute.leadId,
    packet: pipeline.claimPacket,
  });
  await appendEscalationHistory({
    disputeId,
    disputeVersionId: version.id,
    leadId: dispute.leadId,
    fromStage: dispute.escalationStage,
    toStage: pipeline.stage,
    actorType: "admin",
    actorId: approvedBy,
    reason: pipeline.stageReason,
  });
  await saveDisputeRecord(nextDispute);
  await appendMailingEvent({
    id: `event_${dispute.id}_approved_${approvedAt}`,
    disputeId,
    eventType: "approved",
    occurredAt: approvedAt,
    actor: approvedBy,
    notes: "Dispute approved for mailing.",
  });
  await emitDomainEvent({
    type: DOMAIN_EVENT_NAMES.disputeApproved,
    aggregateType: "dispute",
    aggregateId: disputeId,
    actorType: "admin",
    actorId: approvedBy,
    payload: {
      leadId: dispute.leadId,
      bureau: dispute.bureau,
      versionId: version.id,
      workflowStatus: nextDispute.workflowStatus,
    },
    metadata: {
      source: "approveDisputeForMailing",
    },
  });
  const lead = getLeadById(dispute.leadId);
  if (lead) {
    await trackDisputeApprovedForLead(lead, {
      disputeId,
      bureau: dispute.bureau,
      versionId: version.id,
    });
  }

  return { dispute: nextDispute, version, alreadyApproved: false };
}

export async function generateFinalMailingVersion(disputeId: string) {
  const { dispute, currentVersion, versions } = await getDisputeById(disputeId);
  if (!dispute || !currentVersion) {
    throw new Error("Dispute record not found.");
  }

  if (dispute.workflowStatus !== "approved_pending_pdf" &&
    dispute.workflowStatus !== "awaiting_payment" &&
    dispute.workflowStatus !== "paid_ready_to_send") {
    throw new Error("Dispute is not ready for final mailing PDF generation.");
  }

  const lead = getLeadById(dispute.leadId);
  if (!lead) {
    throw new Error("Lead not found.");
  }

  if (currentVersion.kind === "mailing_final" && currentVersion.pdfGeneratedAt) {
    const pdfBuffer = generateSimplePdfBuffer(renderDisputePdfContent(currentVersion, lead));
    return { dispute, version: currentVersion, pdfBuffer };
  }

  const generatedAt = nowIso();
  const strategyOutput = currentVersion.strategyOutput ?? resolveStrategyOutput({
    disputeId: dispute.id,
    leadId: dispute.leadId,
    findings: currentVersion.findings,
    versionNumber: currentVersion.versionNumber + 1,
    previousVersions: versions
      .filter((item) => item.id !== currentVersion.id)
      .map((item) => ({ findings: item.findings })),
  });
  const pipeline = strategyOutput.pipeline!;
  const finalVersion: DisputeVersionRecord = {
    ...currentVersion,
    id: `${dispute.id}_v${currentVersion.versionNumber + 1}`,
    versionNumber: currentVersion.versionNumber + 1,
    kind: "mailing_final",
    strategyOutput,
    generatedBy: "system",
    createdAt: generatedAt,
    pdfGeneratedAt: generatedAt,
    pdfAssetPath: `/generated/${dispute.id}-mailing-final.pdf`,
    notes: [...currentVersion.notes, "Mailing-ready PDF version generated."],
  };

  const nextStatus =
    dispute.workflowStatus === "approved_pending_pdf"
      ? applyWorkflowTransition({
          family: "mailing",
          fromStatus: "approved_pending_pdf",
          toStatus: "awaiting_payment",
          context: {
            hasFinalPdf: true,
          },
        }).nextStatus
      : dispute.workflowStatus;

  const nextDispute: DisputeRecord = {
    ...dispute,
    currentVersionId: finalVersion.id,
    processingStatus:
      dispute.processingStatus === "service_rendered" ? "service_rendered" : dispute.processingStatus,
    workflowStatus: nextStatus,
    escalationStage: pipeline.stage,
    escalationUpdatedAt: generatedAt,
    updatedAt: generatedAt,
  };

  await saveDisputeVersion(finalVersion);
  await storeDisputeDefectFindings({
    disputeVersionId: finalVersion.id,
    leadId: dispute.leadId,
    findings: finalVersion.findings,
  });
  await storeDisputeStrategyOutput({
    disputeVersionId: finalVersion.id,
    leadId: dispute.leadId,
    strategyOutput,
  });
  await storeClaimPacket({
    disputeId,
    disputeVersionId: finalVersion.id,
    leadId: dispute.leadId,
    packet: pipeline.claimPacket,
  });
  await appendEscalationHistory({
    disputeId,
    disputeVersionId: finalVersion.id,
    leadId: dispute.leadId,
    fromStage: dispute.escalationStage,
    toStage: pipeline.stage,
    actorType: "system",
    actorId: "pdf_generator",
    reason: pipeline.stageReason,
  });
  await saveDisputeRecord(nextDispute);
  await appendMailingEvent({
    id: `event_${dispute.id}_pdf_${generatedAt}`,
    disputeId,
    eventType: "pdf_generated",
    occurredAt: generatedAt,
    actor: "system",
    notes: "Mailing-ready PDF version generated.",
  });
  await emitDomainEvent({
    type: DOMAIN_EVENT_NAMES.disputeFinalPdfGenerated,
    aggregateType: "dispute",
    aggregateId: disputeId,
    actorType: "system",
    actorId: "pdf_generator",
    payload: {
      leadId: dispute.leadId,
      bureau: dispute.bureau,
      versionId: finalVersion.id,
      pdfAssetPath: finalVersion.pdfAssetPath,
      workflowStatus: nextDispute.workflowStatus,
    },
    metadata: {
      source: "generateFinalMailingVersion",
    },
  });

  const pdfBuffer = generateSimplePdfBuffer(renderDisputePdfContent(finalVersion, lead, dispute.bureau));
  return { dispute: nextDispute, version: finalVersion, pdfBuffer };
}
