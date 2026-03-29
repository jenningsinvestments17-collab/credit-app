import { mutateMailingPipelineStore, readMailingPipelineStore } from "@/lib/db";
import type { MailingEventRecord, MailingJobRecord, PaymentRecord } from "@/lib/types";

export async function listMailingJobs() {
  const store = await readMailingPipelineStore();
  return store.mailingJobs;
}

export async function listPaymentRecords() {
  const store = await readMailingPipelineStore();
  return store.paymentRecords;
}

export async function getMailingJobByDisputeId(disputeId: string) {
  const store = await readMailingPipelineStore();
  return store.mailingJobs.find((item) => item.disputeId === disputeId) ?? null;
}

export async function saveMailingJob(job: MailingJobRecord) {
  await mutateMailingPipelineStore((store) => ({
    ...store,
    mailingJobs: [...store.mailingJobs.filter((item) => item.id !== job.id), job],
  }));
  return job;
}

export async function savePaymentRecord(record: PaymentRecord) {
  await mutateMailingPipelineStore((store) => ({
    ...store,
    paymentRecords: [...store.paymentRecords.filter((item) => item.id !== record.id), record],
  }));
  return record;
}

export async function getPaymentRecordByDisputeId(disputeId: string) {
  const store = await readMailingPipelineStore();
  return store.paymentRecords.find((item) => item.disputeId === disputeId) ?? null;
}

export async function appendMailingEventRecord(event: MailingEventRecord) {
  await mutateMailingPipelineStore((store) => ({
    ...store,
    mailingEvents: [...store.mailingEvents.filter((item) => item.id !== event.id), event],
  }));
  return event;
}
