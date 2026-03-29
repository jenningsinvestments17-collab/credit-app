import type { MailingJobRecord } from "@/lib/types";

export async function submitCertifiedMailJob(job: MailingJobRecord) {
  // Placeholder integration point for Lob / PostalMethods / vendor API.
  return {
    providerJobId: `provider_${job.id}`,
    acceptedAt: new Date().toISOString(),
    providerStatus: "accepted" as const,
  };
}
