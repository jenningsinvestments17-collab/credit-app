import { listDisputes } from "@/lib/disputes/repository";
import { certifiedMailQueueStatusMeta } from "@/lib/disputes/mailing";
import { listMailingJobs } from "@/lib/mailing/repository";

export async function getCertifiedMailQueue() {
  const disputes = await listDisputes();
  const mailingJobs = await listMailingJobs();

  return mailingJobs.map((job) => ({
    mailingJob: job,
    dispute: disputes.find((dispute) => dispute.id === job.disputeId) ?? null,
  }));
}

export async function getCertifiedMailQueueSummary() {
  const queue = await getCertifiedMailQueue();
  return {
    total: queue.length,
    queued: queue.filter((item) => item.mailingJob.providerStatus === "queued").length,
    mailed: queue.filter((item) =>
      ["accepted", "tracking_received", "delivered"].includes(item.mailingJob.providerStatus),
    ).length,
    failed: queue.filter((item) => item.mailingJob.providerStatus === "failed").length,
  };
}

export { certifiedMailQueueStatusMeta };
