import { mutateMailingPipelineStore, readMailingPipelineStore } from "@/lib/db";
import type { DisputeRecord, DisputeVersionRecord, MailingEventRecord } from "@/lib/types";

export async function listDisputes() {
  const store = await readMailingPipelineStore();
  return store.disputes;
}

export async function getDisputeById(disputeId: string) {
  const store = await readMailingPipelineStore();
  const dispute = store.disputes.find((item) => item.id === disputeId) ?? null;
  const versions = store.disputeVersions
    .filter((item) => item.disputeId === disputeId)
    .sort((a, b) => a.versionNumber - b.versionNumber);
  const currentVersion = versions.find((item) => item.id === dispute?.currentVersionId) ?? null;
  const events = store.mailingEvents.filter((item) => item.disputeId === disputeId);

  return { dispute, versions, currentVersion, events };
}

export async function getDisputeByLeadId(leadId: string) {
  const store = await readMailingPipelineStore();
  const dispute = store.disputes.find((item) => item.leadId === leadId) ?? null;
  if (!dispute) {
    return { dispute: null, versions: [], currentVersion: null, events: [] };
  }

  return getDisputeById(dispute.id);
}

export async function saveDisputeRecord(dispute: DisputeRecord) {
  await mutateMailingPipelineStore((store) => ({
    ...store,
    disputes: [...store.disputes.filter((item) => item.id !== dispute.id), dispute],
  }));
  return dispute;
}

export async function saveDisputeVersion(version: DisputeVersionRecord) {
  await mutateMailingPipelineStore((store) => ({
    ...store,
    disputeVersions: [...store.disputeVersions.filter((item) => item.id !== version.id), version],
  }));
  return version;
}

export async function appendMailingEvent(event: MailingEventRecord) {
  await mutateMailingPipelineStore((store) => ({
    ...store,
    mailingEvents: [...store.mailingEvents.filter((item) => item.id !== event.id), event],
  }));
  return event;
}
