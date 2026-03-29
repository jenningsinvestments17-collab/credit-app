import type { MailingJobRecord } from "@/lib/types";

export async function sendViaLob(job: MailingJobRecord) {
  return {
    providerName: "lob" as const,
    providerJobId: `lob_${job.id}`,
    providerStatus: "accepted" as const,
    trackingNumber: job.trackingNumber ?? `9405${job.id.slice(-8).padStart(8, "0")}`,
    mailedAt: new Date().toISOString(),
    signedReturnReceiptStatus: "pending" as const,
  };
}
