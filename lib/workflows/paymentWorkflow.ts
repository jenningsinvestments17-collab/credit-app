import type { DisputeRecord, PaymentRecord } from "@/lib/types";

export function isPaymentEligible(input: {
  dispute: Pick<DisputeRecord, "processingStatus" | "approvedAt" | "serviceRenderedAt"> | null;
}) {
  return Boolean(
    input.dispute?.approvedAt &&
      input.dispute?.serviceRenderedAt &&
      (input.dispute.processingStatus === "service_rendered" ||
        input.dispute.processingStatus === "queued_for_mailing" ||
        input.dispute.processingStatus === "mailed"),
  );
}

export function shouldShowPaymentCta(payment: PaymentRecord | null, eligible: boolean) {
  if (!eligible) {
    return false;
  }

  if (!payment) {
    return true;
  }

  return [
    "payment_not_collected",
    "payment_required",
    "payment_failed",
    "authorization_expired",
    "ready_to_capture",
    "authorized",
  ].includes(payment.status);
}

export function isRevenueQueueStatus(payment: PaymentRecord | null) {
  if (!payment) {
    return true;
  }

  return [
    "payment_not_collected",
    "payment_required",
    "payment_failed",
    "authorization_expired",
    "authorized",
    "ready_to_capture",
  ].includes(payment.status);
}
