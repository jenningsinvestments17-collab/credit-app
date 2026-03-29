import { generateDisputeDraftForLead } from "@/lib/ai/generateDisputeDraft";
import { getAIReadiness } from "@/lib/ai/review";
import { findUserByEmail } from "@/lib/db/auth";
import { DashboardPaymentStatus, upsertDashboardPayment } from "@/lib/db/dashboardPayments";
import { emitDomainEvent } from "@/lib/events/emit";
import { DOMAIN_EVENT_NAMES } from "@/lib/events/eventNames";
import { getDisputeById, getDisputeByLeadId, saveDisputeRecord, saveDisputeVersion } from "@/lib/disputes/repository";
import { getLeadById } from "@/lib/leads";
import { recordOpsError } from "@/lib/monitoring/ops";
import { appendMailingEventRecord, getPaymentRecordByDisputeId, savePaymentRecord } from "@/lib/mailing/repository";
import { buildAutomationJob, queueAutomationJob } from "@/lib/queue/automationQueue";
import { getCreditReportState } from "@/lib/services/creditReportService";
import { getRequiredDocumentState } from "@/lib/services/documentService";
import { trackAiGeneratedForLead, trackDisputeApprovedForLead } from "@/lib/services/analytics";
import { queueAiDraftReadyNotifications } from "@/lib/services/notifications";
import { canApproveGeneratedDispute, canMarkServiceRendered, canRejectGeneratedDispute } from "@/lib/workflows/disputeWorkflow";
import type { DisputeRecord, DisputeVersionRecord, Lead, PaymentRecord } from "@/lib/types";

function nowIso() {
  return new Date().toISOString();
}

function buildBaseDispute(lead: Lead): DisputeRecord {
  const now = nowIso();
  return {
    id: `dispute_${lead.id}`,
    leadId: lead.id,
    bureau: "Experian",
    currentVersionId: `dispute_${lead.id}_v1`,
    processingStatus: "documents_pending",
    workflowStatus: "awaiting_admin_approval",
    createdAt: now,
    updatedAt: now,
  };
}

export function getAiWorkflowStateForLead(lead: Lead) {
  const documentState = getRequiredDocumentState(lead);
  const reportState = getCreditReportState(lead);
  const readiness = getAIReadiness(lead);
  const eligibleForProcessing = documentState.allValidated && reportState.allReady;

  return {
    documentState,
    reportState,
    readiness,
    eligibleForProcessing,
    status: !documentState.allUploaded
      ? "documents_pending"
      : !documentState.allValidated
        ? "documents_submitted"
        : !reportState.allReady
          ? "documents_verified"
          : "eligible_for_processing",
    blockedReasons: [
      ...documentState.missingDocuments.map((item) => `${item.label} is still missing.`),
      ...documentState.pendingValidationDocuments
        .filter((item) => item.status !== "missing")
        .map((item) => `${item.label} is uploaded but still waiting on validation.`),
      ...documentState.rejectedDocuments.map((item) => `${item.label} was rejected: ${item.validationReason ?? "validation failed"}.`),
      ...reportState.blockedReasons,
      ...readiness.missingItems,
    ].filter((value, index, array) => array.indexOf(value) === index),
  } as const;
}

export async function ensureDisputeRecordForLead(lead: Lead) {
  const existing = await getDisputeByLeadId(lead.id);
  const aiState = getAiWorkflowStateForLead(lead);

  if (existing.dispute) {
    const nextDispute: DisputeRecord = {
      ...existing.dispute,
      processingStatus:
        existing.dispute.processingStatus === "approved" ||
        existing.dispute.processingStatus === "service_rendered" ||
        existing.dispute.processingStatus === "queued_for_mailing" ||
        existing.dispute.processingStatus === "mailed"
          ? existing.dispute.processingStatus
          : aiState.status,
      updatedAt: nowIso(),
    };
    await saveDisputeRecord(nextDispute);
    return { ...existing, dispute: nextDispute, aiState };
  }

  const baseDispute = {
    ...buildBaseDispute(lead),
    processingStatus: aiState.status,
  };
  await saveDisputeRecord(baseDispute);
  return { dispute: baseDispute, versions: [], currentVersion: null, events: [], aiState };
}

export async function evaluateAndQueueAiForLead(lead: Lead, actorId = "system") {
  const { dispute, aiState } = await ensureDisputeRecordForLead(lead);
  if (!dispute) {
    throw new Error("Dispute record missing.");
  }

  if (!aiState.eligibleForProcessing) {
    return { dispute, eligible: false, blockedReasons: aiState.blockedReasons };
  }

  const queuedAt = nowIso();
  const nextDispute: DisputeRecord = {
    ...dispute,
    processingStatus: "queued_for_ai",
    updatedAt: queuedAt,
  };
  await saveDisputeRecord(nextDispute);
  await appendMailingEventRecord({
    id: `event_${dispute.id}_ai_queued_${queuedAt}`,
    disputeId: dispute.id,
    eventType: "ai_queued",
    occurredAt: queuedAt,
    actor: actorId,
    notes: "Dispute generation queued.",
  });
  await emitDomainEvent({
    type: DOMAIN_EVENT_NAMES.aiReviewRequested,
    aggregateType: "dispute",
    aggregateId: dispute.id,
    actorType: "system",
    actorId,
    payload: {
      leadId: lead.id,
      disputeId: dispute.id,
      blockers: [],
    },
    metadata: {
      source: "evaluateAndQueueAiForLead",
    },
  });
  await queueAutomationJob(
    buildAutomationJob({
      id: `job_ai_${lead.id}_${Date.now()}`,
      type: "ai_generation",
      payload: {
        leadId: lead.id,
        disputeId: dispute.id,
      },
      dedupeKey: `ai_generation:${lead.id}:${dispute.id}`,
      maxAttempts: 4,
    }),
  );

  return { dispute: nextDispute, eligible: true, blockedReasons: [] };
}

export async function processAiGenerationJob(job: {
  payload: {
    leadId?: string;
    disputeId?: string;
  };
}) {
  const leadId = String(job.payload.leadId ?? "");
  const disputeId = String(job.payload.disputeId ?? "");
  const lead = getLeadById(leadId);
  if (!lead) {
    throw new Error("Lead not found for AI generation.");
  }

  const { dispute, versions, aiState } = await ensureDisputeRecordForLead(lead);
  if (!dispute || dispute.id !== disputeId || !aiState.eligibleForProcessing) {
    throw new Error("The client is not eligible for AI dispute generation yet.");
  }

  const processingAt = nowIso();
  await saveDisputeRecord({
    ...dispute,
    processingStatus: "ai_in_progress",
    updatedAt: processingAt,
  });
  await appendMailingEventRecord({
    id: `event_${dispute.id}_ai_processing_${processingAt}`,
    disputeId: dispute.id,
    eventType: "ai_processing",
    occurredAt: processingAt,
    actor: "ai_generation_worker",
    notes: "AI dispute generation started.",
  });

  const draft = await generateDisputeDraftForLead(lead);
  if (!draft) {
    await recordOpsError({
      scope: "ai_generation",
      message: "AI dispute generation failed because readiness requirements were not met.",
      metadata: {
        leadId,
        disputeId,
      },
    });
    throw new Error("AI dispute generation could not complete because readiness requirements are not met.");
  }

  const generatedAt = nowIso();
  const versionNumber = versions.length + 1;
  const versionId = `${dispute.id}_v${versionNumber}`;
  const version: DisputeVersionRecord = {
    id: versionId,
    disputeId: dispute.id,
    versionNumber,
    kind: "ai_draft",
    letterText: draft.letterText,
    summary: draft.summary,
    findings: draft.findings,
    strategyOutput: draft.strategyOutput,
    generatedBy: "ai",
    createdAt: generatedAt,
    notes: draft.modelInputNotes,
  };
  const nextDispute: DisputeRecord = {
    ...dispute,
    currentVersionId: versionId,
    processingStatus: "awaiting_admin_review",
    workflowStatus: "awaiting_admin_approval",
    updatedAt: generatedAt,
  };

  await saveDisputeVersion(version);
  await saveDisputeRecord(nextDispute);
  await appendMailingEventRecord({
    id: `event_${dispute.id}_ai_generated_${generatedAt}`,
    disputeId: dispute.id,
    eventType: versions.length > 0 ? "regenerated" : "ai_generated",
    occurredAt: generatedAt,
    actor: "ai_generation_worker",
    notes: "AI draft generated and routed to admin review.",
  });
  await emitDomainEvent({
    type: DOMAIN_EVENT_NAMES.disputeDraftGenerated,
    aggregateType: "dispute",
    aggregateId: dispute.id,
    actorType: "system",
    actorId: "ai_generation_worker",
    payload: {
      leadId,
      disputeId,
      versionId,
      findingsCount: version.findings.length,
    },
    metadata: {
      source: "processAiGenerationJob",
    },
  });
  await trackAiGeneratedForLead(lead, {
    bureau: draft.bureau,
    findingsCount: draft.findings.length,
    draftStatus: draft.status,
  });
  await queueAiDraftReadyNotifications({ lead });

  return { dispute: nextDispute, version, draft, aiState };
}

export async function generateDisputeForLead(lead: Lead, actorId = "admin") {
  await evaluateAndQueueAiForLead(lead, actorId);
  return processAiGenerationJob({
    payload: {
      leadId: lead.id,
      disputeId: `dispute_${lead.id}`,
    },
  });
}

export async function rejectDisputeGeneration(disputeId: string, actorId = "admin") {
  const { dispute, currentVersion } = await getDisputeById(disputeId);
  if (!dispute || !currentVersion || !canRejectGeneratedDispute(dispute.processingStatus)) {
    throw new Error("Dispute is not in a rejectable review state.");
  }

  const rejectedAt = nowIso();
  const rejectedVersion: DisputeVersionRecord = {
    ...currentVersion,
    id: `${dispute.id}_v${currentVersion.versionNumber + 1}`,
    versionNumber: currentVersion.versionNumber + 1,
    kind: "admin_rejected",
    generatedBy: "admin",
    createdAt: rejectedAt,
    notes: [...currentVersion.notes, "Rejected during admin review and sent back for regeneration."],
  };
  const nextDispute: DisputeRecord = {
    ...dispute,
    currentVersionId: rejectedVersion.id,
    processingStatus: "rejected",
    updatedAt: rejectedAt,
  };

  await saveDisputeVersion(rejectedVersion);
  await saveDisputeRecord(nextDispute);
  await appendMailingEventRecord({
    id: `event_${dispute.id}_rejected_${rejectedAt}`,
    disputeId: dispute.id,
    eventType: "rejected",
    occurredAt: rejectedAt,
    actor: actorId,
    notes: "Draft rejected during admin review.",
  });

  return { dispute: nextDispute, version: rejectedVersion };
}

export async function approveGeneratedDispute(disputeId: string, actorId = "Admin reviewer") {
  const { dispute } = await getDisputeById(disputeId);
  if (!dispute || !canApproveGeneratedDispute(dispute.processingStatus)) {
    throw new Error("Dispute is not ready for approval.");
  }

  const approvedAt = nowIso();
  const nextDispute: DisputeRecord = {
    ...dispute,
    processingStatus: "approved",
    approvedAt,
    approvedBy: actorId,
    workflowStatus: "approved_pending_pdf",
    updatedAt: approvedAt,
  };

  await saveDisputeRecord(nextDispute);
  await appendMailingEventRecord({
    id: `event_${dispute.id}_approved_${approvedAt}`,
    disputeId: dispute.id,
    eventType: "approved",
    occurredAt: approvedAt,
    actor: actorId,
    notes: "Dispute approved after admin review.",
  });
  await emitDomainEvent({
    type: DOMAIN_EVENT_NAMES.disputeApproved,
    aggregateType: "dispute",
    aggregateId: dispute.id,
    actorType: "admin",
    actorId,
    payload: {
      leadId: dispute.leadId,
      disputeId: dispute.id,
    },
    metadata: {
      source: "approveGeneratedDispute",
    },
  });
  const lead = getLeadById(dispute.leadId);
  if (lead) {
    await trackDisputeApprovedForLead(lead, {
      disputeId: dispute.id,
      bureau: dispute.bureau,
    });
  }

  await queueAutomationJob(
    buildAutomationJob({
      id: `job_pdf_${dispute.id}_${Date.now()}`,
      type: "pdf_generation",
      payload: {
        disputeId: dispute.id,
      },
      dedupeKey: `pdf_generation:${dispute.id}`,
      maxAttempts: 4,
    }),
  );

  return nextDispute;
}

export async function markDisputeServiceRendered(disputeId: string, actorId = "Admin reviewer") {
  const { dispute, currentVersion } = await getDisputeById(disputeId);
  if (!dispute || !currentVersion || !canMarkServiceRendered(dispute.processingStatus)) {
    throw new Error("Dispute is not ready to be marked as service rendered.");
  }

  const renderedAt = nowIso();
  const renderedVersion: DisputeVersionRecord = {
    ...currentVersion,
    id: `${dispute.id}_v${currentVersion.versionNumber + 1}`,
    versionNumber: currentVersion.versionNumber + 1,
    kind: "service_rendered",
    generatedBy: "admin",
    createdAt: renderedAt,
    notes: [...currentVersion.notes, "Service rendered confirmed and payment became eligible."],
  };
  const nextDispute: DisputeRecord = {
    ...dispute,
    currentVersionId: renderedVersion.id,
    processingStatus: "service_rendered",
    serviceRenderedAt: renderedAt,
    updatedAt: renderedAt,
  };

  await saveDisputeVersion(renderedVersion);
  await saveDisputeRecord(nextDispute);
  await appendMailingEventRecord({
    id: `event_${dispute.id}_service_rendered_${renderedAt}`,
    disputeId: dispute.id,
    eventType: "service_rendered",
    occurredAt: renderedAt,
    actor: actorId,
    notes: "Service rendered confirmed. Payment is now eligible.",
  });

  const existingPayment = await getPaymentRecordByDisputeId(dispute.id);
  if (!existingPayment) {
    const payment: PaymentRecord = {
      id: `payment_${dispute.id}`,
      disputeId: dispute.id,
      leadId: dispute.leadId,
      amountCents: 40500,
      currency: "usd",
      status: "payment_not_collected",
      requestedAt: renderedAt,
      createdAt: renderedAt,
      updatedAt: renderedAt,
    };
    await savePaymentRecord(payment);
  }

  const lead = getLeadById(dispute.leadId);
  const user = lead?.email ? await findUserByEmail(lead.email) : null;
  await upsertDashboardPayment({
    userId: user?.id ?? null,
    leadId: dispute.leadId,
    disputeId: dispute.id,
    amountCents: existingPayment?.amountCents ?? 40500,
    currency: "usd",
    status: DashboardPaymentStatus.payment_required,
    requestedAt: new Date(renderedAt),
    serviceRenderedAt: new Date(renderedAt),
    metadata: {
      actorId,
      processingStatus: nextDispute.processingStatus,
    },
  });

  return { dispute: nextDispute, version: renderedVersion };
}
