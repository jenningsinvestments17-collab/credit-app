import { buildDashboardDisclaimerLines } from "@/lib/compliance/disclaimers";
import { getDisputeWorkflowByLeadId } from "@/lib/disputes/service";
import { getMailingJobByDisputeId, getPaymentRecordByDisputeId } from "@/lib/mailing/repository";
import { canClientAccessContracts } from "@/lib/services/workflowAccess";
import { buildClientDashboardState } from "@/lib/workflows/clientDashboard";
import type { Lead } from "@/lib/types";
import type { ClientDashboardBanner, ClientDashboardViewModel } from "@/types/dashboard";

function buildDashboardBanners(searchParams?: {
  resume?: string;
  mailingPayment?: string;
  status?: string;
  checkout?: string;
  updatePaymentMethod?: string;
}) {
  const banners: ClientDashboardBanner[] = [];

  if (searchParams?.resume === "1") {
    banners.push({
      id: "resume",
      tone: "info",
      text: "You were returned to your portal and progress has been restored to the next recommended step.",
    });
  }

  if (searchParams?.mailingPayment) {
    banners.push({
      id: "mailing-payment",
      tone: "warning",
      text: `Mailing payment status: ${searchParams.status?.replaceAll("_", " ") ?? "pending"}.`,
      href: searchParams.updatePaymentMethod ?? searchParams.checkout,
      hrefLabel: searchParams.updatePaymentMethod
        ? "Update payment method"
        : searchParams.checkout
          ? "Open checkout"
          : undefined,
    });
  }

  return banners;
}

export async function buildClientDashboardViewModel(input: {
  lead: Lead;
  searchParams?: {
    resume?: string;
    mailingPayment?: string;
    status?: string;
    checkout?: string;
    updatePaymentMethod?: string;
  };
}): Promise<ClientDashboardViewModel> {
  const { lead, searchParams } = input;
  const disputeState = await getDisputeWorkflowByLeadId(lead.id);
  const payment = disputeState.dispute
    ? await getPaymentRecordByDisputeId(disputeState.dispute.id)
    : null;
  const mailingJob = disputeState.dispute
    ? await getMailingJobByDisputeId(disputeState.dispute.id)
    : null;
  const state = buildClientDashboardState({
    lead,
    dispute: disputeState.dispute,
    payment,
    mailingJob,
    events: disputeState.events,
  });

  return {
    lead,
    leadFirstName: lead.fullName.split(" ")[0] ?? lead.fullName,
    disclaimers: buildDashboardDisclaimerLines(),
    banners: buildDashboardBanners(searchParams),
    contractPacketOpen: canClientAccessContracts(lead),
    contractDocuments: lead.contractDocuments,
    dispute: disputeState.dispute,
    payment,
    mailingJob,
    events: disputeState.events,
    ...state,
  };
}
