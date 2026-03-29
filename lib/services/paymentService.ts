import { getDisputeById } from "@/lib/disputes/repository";
import { getPaymentRecordByDisputeId } from "@/lib/mailing/repository";
import { createMailingPaymentRequest } from "@/lib/mailing/service";
import { syncMailingEligibility } from "@/lib/services/mailingService";
import { isPaymentEligible, isRevenueQueueStatus, shouldShowPaymentCta } from "@/lib/workflows/paymentWorkflow";

export async function getPaymentEligibility(disputeId: string) {
  const { dispute } = await getDisputeById(disputeId);
  const payment = await getPaymentRecordByDisputeId(disputeId);
  const eligible = isPaymentEligible({ dispute });

  return {
    dispute,
    payment,
    eligible,
    showClientCta: shouldShowPaymentCta(payment, eligible),
    showRevenueQueue: eligible && isRevenueQueueStatus(payment),
  };
}

export async function requestEligiblePayment(disputeId: string, options?: { baseUrl?: string }) {
  const eligibility = await getPaymentEligibility(disputeId);
  if (!eligibility.eligible) {
    throw new Error("Payment is not eligible until the dispute is approved and service is rendered.");
  }

  return createMailingPaymentRequest(disputeId, options);
}

export async function handlePaymentAutomation(disputeId: string) {
  const eligibility = await getPaymentEligibility(disputeId);
  if (!eligibility.eligible) {
    return eligibility;
  }
  await syncMailingEligibility(disputeId);
  return eligibility;
}
