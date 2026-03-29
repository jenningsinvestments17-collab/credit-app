import type { DisputeRecord, MailingJobRecord, PaymentRecord } from "@/lib/types";
import { isPaymentSettled } from "@/lib/stripe/service";

export function isMailingEligible(input: {
  dispute: Pick<DisputeRecord, "approvedAt" | "serviceRenderedAt" | "workflowStatus"> | null;
  finalPdfExists: boolean;
  payment: PaymentRecord | null;
}) {
  if (!input.dispute?.approvedAt || !input.dispute?.serviceRenderedAt || !input.finalPdfExists) {
    return false;
  }

  return Boolean(input.payment && isPaymentSettled(input.payment));
}

export function hasLiveMailingJob(job: MailingJobRecord | null) {
  return Boolean(job);
}
