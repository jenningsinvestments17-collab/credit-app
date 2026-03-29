import { getContractCounts } from "@/lib/contracts";
import {
  getDocumentCounts,
  hasAllBureauReports,
  isLeadReadyForAIReview,
  isLeadReadyForReview,
  leadStatusMeta,
} from "@/lib/leads";
import { deriveClientProgress } from "@/lib/progress";
import { buildMailJob } from "@/lib/queue/mailQueue";
import type { Lead, MailJob, MailTemplateType } from "@/lib/types";

type TriggerPreview = {
  type: MailTemplateType;
  label: string;
  reason: string;
};

function buildPreview(type: MailTemplateType, reason: string): TriggerPreview {
  return {
    type,
    label: type.replaceAll("_", " "),
    reason,
  };
}

export function getBookingTriggerPreview() {
  return [
    buildPreview(
      "booking_confirmation",
      "Confirms the consultation and points the client into intake.",
    ),
    buildPreview(
      "new_lead_alert",
      "Alerts admin that a new booked lead entered the pipeline.",
    ),
  ];
}

export function getIntakeTriggerPreview(lead?: Lead) {
  const previews: TriggerPreview[] = [];

  if (!lead) {
    return [
      buildPreview(
        "intake_reminder",
        "Can follow up when intake starts but is not completed.",
      ),
      buildPreview(
        "missing_documents",
        "Can remind the client when reports or required documents are still missing.",
      ),
    ];
  }

  const progress = deriveClientProgress(lead);
  const missingDocuments = lead.documents
    .filter((document) => document.status === "missing")
    .map((document) => document.label);

  if (lead.intakeStatus !== "completed") {
    previews.push(
      buildPreview(
        "intake_reminder",
        `Guides the client back into ${progress.nextActionLabel.toLowerCase()}.`,
      ),
    );
  }

  if (missingDocuments.length > 0) {
    previews.push(
      buildPreview(
        "missing_documents",
        `Reminds the client to upload: ${missingDocuments.join(", ")}.`,
      ),
    );
  }

  if (isLeadReadyForReview(lead)) {
    previews.push(
      buildPreview(
        "next_step_guidance",
        "Explains that the file is organized and the next internal step is review.",
      ),
    );
    previews.push(
      buildPreview(
        "intake_completed",
        "Notifies admin that the intake side of the file is ready for review.",
      ),
    );
  }

  if (isLeadReadyForAIReview(lead)) {
    previews.push(
      buildPreview(
        "ready_for_ai_review",
        "Alerts admin that all 3 bureau reports are ready for AI review.",
      ),
    );
  }

  return previews;
}

export function getContractTriggerPreview(lead: Lead) {
  const counts = getContractCounts(lead.contractDocuments);
  const previews: TriggerPreview[] = [];

  if (counts.sent > 0 && counts.signed < counts.totalRequired) {
    previews.push(
      buildPreview(
        "contracts_sent",
        "Invites the client to review and sign the onboarding packet.",
      ),
    );
  }

  if (lead.contractPacketStatus === "signed" || lead.contractPacketStatus === "completed") {
    previews.push(
      buildPreview(
        "contracts_signed",
        "Confirms completion and reinforces that onboarding is moving forward.",
      ),
    );
  }

  return previews;
}

export function getLeadMailTriggerPreview(lead: Lead) {
  return [...getIntakeTriggerPreview(lead), ...getContractTriggerPreview(lead)];
}

export function getQueuedWorkflowNotificationsForLead(lead: Lead): MailJob[] {
  const progress = deriveClientProgress(lead);
  const documentCounts = getDocumentCounts(lead.documents);
  const queuedAt = lead.updatedAt;
  const jobs: MailJob[] = [];

  if (lead.bookingStatus === "booked") {
    jobs.push(
      buildMailJob({
        id: `preview_booking_${lead.id}`,
        leadId: lead.id,
        type: "booking_confirmation",
        to: lead.email,
        queuedAt,
      }),
    );
  }

  if (lead.intakeStatus !== "completed") {
    jobs.push(
      buildMailJob({
        id: `preview_intake_${lead.id}`,
        leadId: lead.id,
        type: "intake_reminder",
        to: lead.email,
        queuedAt,
        scheduledFor: queuedAt,
      }),
    );
  }

  if (documentCounts.missing > 0) {
    jobs.push(
      buildMailJob({
        id: `preview_missing_docs_${lead.id}`,
        leadId: lead.id,
        type: "missing_documents",
        to: lead.email,
        queuedAt,
      }),
    );
  }

  if (isLeadReadyForReview(lead)) {
    jobs.push(
      buildMailJob({
        id: `preview_next_step_${lead.id}`,
        leadId: lead.id,
        type: "next_step_guidance",
        to: lead.email,
        queuedAt,
      }),
    );
    jobs.push(
      buildMailJob({
        id: `preview_intake_complete_${lead.id}`,
        leadId: lead.id,
        type: "intake_completed",
        to: "admin@creduconsulting.com",
        queuedAt,
      }),
    );
  }

  if (hasAllBureauReports(lead.documents) && isLeadReadyForAIReview(lead)) {
    jobs.push(
      buildMailJob({
        id: `preview_ai_ready_${lead.id}`,
        leadId: lead.id,
    type: "ready_for_ai_review",
        to: "admin@creduconsulting.com",
        queuedAt,
      }),
    );
  }

  if (
    lead.contractPacketStatus === "sent" ||
    lead.contractPacketStatus === "awaiting_signature" ||
    lead.contractPacketStatus === "partially_signed"
  ) {
    jobs.push(
      buildMailJob({
        id: `preview_contracts_sent_${lead.id}`,
        leadId: lead.id,
        type: "contracts_sent",
        to: lead.email,
        queuedAt,
      }),
    );
  }

  if (lead.contractPacketStatus === "signed" || lead.contractPacketStatus === "completed") {
    jobs.push(
      buildMailJob({
        id: `preview_contracts_signed_${lead.id}`,
        leadId: lead.id,
        type: "contracts_signed",
        to: lead.email,
        queuedAt,
      }),
    );
  }

  return jobs.map((job) => ({
    ...job,
    subject:
      job.type === "next_step_guidance"
        ? `${progress.nextActionLabel} for ${lead.fullName}`
        : `${leadStatusMeta[lead.leadStatus].label} workflow notice`,
  }));
}
