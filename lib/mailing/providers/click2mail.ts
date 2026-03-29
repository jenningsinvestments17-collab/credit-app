import type { MailingJobRecord } from "@/lib/types";

export async function sendViaClick2Mail(job: MailingJobRecord) {
  return {
    providerName: "click2mail" as const,
    providerJobId: `c2m_${job.id}`,
    providerStatus: "accepted" as const,
    trackingNumber: job.trackingNumber ?? `7015${job.id.slice(-8).padStart(8, "0")}`,
    mailedAt: new Date().toISOString(),
    signedReturnReceiptStatus: "pending" as const,
  };
}
