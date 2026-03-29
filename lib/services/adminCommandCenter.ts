import { getAllLeads, getLeadById } from "@/lib/leads";
import { listMailingJobs, listPaymentRecords } from "@/lib/mailing/repository";
import { getRequiredDocumentState } from "@/lib/services/documentService";
import { getAiWorkflowStateForLead } from "@/lib/services/disputeService";
import { isRevenueQueueStatus } from "@/lib/workflows/paymentWorkflow";
import { listDisputes } from "@/lib/disputes/repository";
import type { Lead, MailingJobRecord, PaymentRecord } from "@/lib/types";

export type AdminCommandStat = {
  id: string;
  label: string;
  count: number;
  helper: string;
};

export type AdminQueueSectionModel = {
  id: string;
  title: string;
  helper: string;
  leads: Lead[];
};

export type AdminCommandCenterModel = {
  stats: AdminCommandStat[];
  sections: AdminQueueSectionModel[];
};

function sortLeads(leads: Lead[]) {
  return [...leads].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

function mapPaymentsToLeads(payments: PaymentRecord[]) {
  return payments
    .map((payment) => getLeadById(payment.leadId))
    .filter((lead): lead is Lead => Boolean(lead));
}

function mapMailJobsToLeads(mailJobs: MailingJobRecord[]) {
  return mailJobs
    .map((job) => getLeadById(job.leadId))
    .filter((lead): lead is Lead => Boolean(lead));
}

export async function buildAdminCommandCenter(): Promise<AdminCommandCenterModel> {
  const leads = getAllLeads();
  const disputes = await listDisputes();
  const payments = await listPaymentRecords();
  const mailingJobs = await listMailingJobs();

  const docsWaiting = leads.filter((lead) => {
    const documentState = getRequiredDocumentState(lead);
    return !documentState.allUploaded || !documentState.allValidated;
  });

  const readyForAi = leads.filter((lead) => {
    const aiState = getAiWorkflowStateForLead(lead);
    const dispute = disputes.find((item) => item.leadId === lead.id);
    return aiState.eligibleForProcessing && (!dispute || dispute.processingStatus === "eligible_for_processing" || dispute.processingStatus === "rejected");
  });

  const disputesAwaitingReview = leads.filter((lead) => {
    const dispute = disputes.find((item) => item.leadId === lead.id);
    return dispute?.processingStatus === "awaiting_admin_review" || dispute?.processingStatus === "ai_generated";
  });

  const approvedDisputes = leads.filter((lead) => {
    const dispute = disputes.find((item) => item.leadId === lead.id);
    return dispute?.processingStatus === "approved" || dispute?.processingStatus === "service_rendered";
  });

  const paymentsPending = mapPaymentsToLeads(
    payments.filter((payment) => isRevenueQueueStatus(payment)),
  );

  const mailQueueLeads = mapMailJobsToLeads(
    mailingJobs.filter((job) =>
      ["queued", "submitted", "accepted", "tracking_received"].includes(job.providerStatus),
    ),
  );

  const failedJobs = [
    ...mapPaymentsToLeads(payments.filter((payment) => payment.status === "payment_failed")),
    ...mapMailJobsToLeads(mailingJobs.filter((job) => job.workflowStatus === "failed")),
    ...leads.filter((lead) => getAiWorkflowStateForLead(lead).reportState.failedCount > 0),
  ].filter((lead, index, array) => array.findIndex((item) => item.id === lead.id) === index);

  const newLeads = leads.filter(
    (lead) => lead.leadStatus === "new_lead" || lead.leadStatus === "consultation_booked",
  );

  return {
    stats: [
      {
        id: "lead-count",
        label: "Lead count",
        count: leads.length,
        helper: "Total client files visible in the command center.",
      },
      {
        id: "docs-waiting",
        label: "Docs waiting",
        count: docsWaiting.length,
        helper: "Files still blocked by missing uploads, validation, or report readiness.",
      },
      {
        id: "awaiting-review",
        label: "Disputes awaiting review",
        count: disputesAwaitingReview.length,
        helper: "AI drafts generated and waiting on admin review.",
      },
      {
        id: "payments-pending",
        label: "Payments pending",
        count: paymentsPending.length,
        helper: "Approved and service-rendered cases that still need payment resolution.",
      },
      {
        id: "mail-queue",
        label: "Mail queue",
        count: mailQueueLeads.length,
        helper: "Disputes currently moving through certified mail.",
      },
    ],
    sections: [
      {
        id: "new-leads",
        title: "New leads",
        helper: "Fresh leads and consultation requests that need early movement.",
        leads: sortLeads(newLeads),
      },
      {
        id: "missing-docs",
        title: "Missing docs",
        helper: "Files blocked by missing uploads, missing validation, or failed report parsing.",
        leads: sortLeads(docsWaiting),
      },
      {
        id: "ready-for-ai",
        title: "Ready for AI",
        helper: "Required documents are validated and bureau reports are ready for generation.",
        leads: sortLeads(readyForAi),
      },
      {
        id: "awaiting-review",
        title: "AI drafts awaiting review",
        helper: "Generated drafts waiting for approve, reject, or regenerate decisions.",
        leads: sortLeads(disputesAwaitingReview),
      },
      {
        id: "approved-disputes",
        title: "Approved disputes",
        helper: "Approved cases waiting on service-render confirmation, PDF, or payment unlock.",
        leads: sortLeads(approvedDisputes),
      },
      {
        id: "payment-pending",
        title: "Payment pending",
        helper: "Approved and service-rendered cases blocked until payment is secured.",
        leads: sortLeads(paymentsPending),
      },
      {
        id: "mail-queue",
        title: "Mail queue",
        helper: "Disputes already in certified mail or waiting on tracking movement.",
        leads: sortLeads(mailQueueLeads),
      },
      {
        id: "failed-jobs",
        title: "Failed jobs",
        helper: "Cases needing manual correction because parsing, payment, or provider work failed.",
        leads: sortLeads(failedJobs),
      },
    ],
  };
}
