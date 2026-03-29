import { generateFinalMailingVersion } from "@/lib/disputes/service";
import { getDisputeById, saveDisputeRecord } from "@/lib/disputes/repository";
import { emitDomainEvent } from "@/lib/events/emit";
import { DOMAIN_EVENT_NAMES } from "@/lib/events/eventNames";
import { getMailingJobByDisputeId, getPaymentRecordByDisputeId, saveMailingJob } from "@/lib/mailing/repository";
import { sendCertifiedMail, updateTrackingStatus } from "@/lib/mailing/service";
import { buildAutomationJob, queueAutomationJob } from "@/lib/queue/automationQueue";
import { isMailingEligible } from "@/lib/workflows/mailingWorkflow";

function nowIso() {
  return new Date().toISOString();
}

export async function getMailingEligibility(disputeId: string) {
  const { dispute, currentVersion } = await getDisputeById(disputeId);
  const payment = await getPaymentRecordByDisputeId(disputeId);
  const mailingJob = await getMailingJobByDisputeId(disputeId);
  const finalPdfExists = Boolean(currentVersion?.pdfAssetPath);

  return {
    dispute,
    currentVersion,
    payment,
    mailingJob,
    finalPdfExists,
    eligible: isMailingEligible({
      dispute,
      finalPdfExists,
      payment,
    }),
  };
}

export async function syncMailingEligibility(disputeId: string) {
  const eligibility = await getMailingEligibility(disputeId);
  if (!eligibility.dispute) {
    throw new Error("Dispute not found for mailing eligibility.");
  }

  if (!eligibility.eligible) {
    return eligibility;
  }

  const timestamp = nowIso();
  const job =
    eligibility.mailingJob ??
    (await saveMailingJob({
      id: `mailjob_${disputeId}`,
      disputeId,
      leadId: eligibility.dispute.leadId,
      bureau: eligibility.dispute.bureau,
      workflowStatus: "paid_ready_to_send",
      providerStatus: "not_submitted",
      deliveryStatus: "pending",
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

  if (!eligibility.mailingJob) {
    await emitDomainEvent({
      type: DOMAIN_EVENT_NAMES.certifiedMailQueued,
      aggregateType: "mailing_job",
      aggregateId: job.id,
      actorType: "system",
      actorId: "mailing_eligibility",
      payload: {
        disputeId,
        leadId: eligibility.dispute.leadId,
        workflowStatus: job.workflowStatus,
      },
      metadata: {
        source: "syncMailingEligibility",
      },
    });
  }

  return {
    ...eligibility,
    mailingJob: job,
  };
}

export async function enqueuePdfGeneration(disputeId: string) {
  return queueAutomationJob(
    buildAutomationJob({
      id: `job_pdf_${disputeId}_${Date.now()}`,
      type: "pdf_generation",
      payload: { disputeId },
      dedupeKey: `pdf_generation:${disputeId}`,
      maxAttempts: 4,
    }),
  );
}

export async function processPdfGenerationJob(job: { payload: { disputeId?: string } }) {
  const disputeId = String(job.payload.disputeId ?? "");
  if (!disputeId) {
    throw new Error("PDF generation job is missing dispute id.");
  }

  const result = await generateFinalMailingVersion(disputeId);
  await syncMailingEligibility(disputeId);
  return result;
}

export async function enqueueMailingSubmission(disputeId: string) {
  return queueAutomationJob(
    buildAutomationJob({
      id: `job_mail_${disputeId}_${Date.now()}`,
      type: "mailing_submission",
      payload: { disputeId },
      dedupeKey: `mailing_submission:${disputeId}`,
      maxAttempts: 5,
    }),
  );
}

export async function sendEligibleCertifiedMail(disputeId: string) {
  const eligibility = await getMailingEligibility(disputeId);
  if (!eligibility.eligible) {
    throw new Error("Mailing is not eligible until approval, final PDF generation, and payment requirements are satisfied.");
  }

  return sendCertifiedMail(disputeId);
}

export async function processMailingSubmissionJob(job: { payload: { disputeId?: string } }) {
  const disputeId = String(job.payload.disputeId ?? "");
  if (!disputeId) {
    throw new Error("Mailing submission job is missing dispute id.");
  }
  return sendEligibleCertifiedMail(disputeId);
}

export async function enqueueTrackingReconciliation(input: {
  disputeId: string;
  trackingNumber: string;
  deliveryStatus?: "in_transit" | "delivered";
}) {
  return queueAutomationJob(
    buildAutomationJob({
      id: `job_track_${input.disputeId}_${Date.now()}`,
      type: "tracking_reconciliation",
      payload: input,
      dedupeKey: `tracking_reconciliation:${input.disputeId}:${input.trackingNumber}:${input.deliveryStatus ?? "in_transit"}`,
      maxAttempts: 5,
    }),
  );
}

export async function processTrackingReconciliationJob(job: {
  payload: { disputeId?: string; trackingNumber?: string; deliveryStatus?: "in_transit" | "delivered" };
}) {
  const disputeId = String(job.payload.disputeId ?? "");
  const trackingNumber = String(job.payload.trackingNumber ?? "");
  if (!disputeId || !trackingNumber) {
    throw new Error("Tracking reconciliation job is missing required fields.");
  }
  return updateTrackingStatus({
    disputeId,
    trackingNumber,
    deliveryStatus: job.payload.deliveryStatus ?? "in_transit",
  });
}
