import { mutateMailingPipelineStore, readMailingPipelineStore } from "@/lib/db";
import type { DomainEvent, EventProcessingLogRecord } from "@/lib/types";

export async function appendDomainEvent(event: DomainEvent) {
  await mutateMailingPipelineStore((store) => ({
    ...store,
    domainEvents: [...store.domainEvents.filter((item) => item.id !== event.id), event],
  }));
  return event;
}

export async function appendEventProcessingLog(record: EventProcessingLogRecord) {
  await mutateMailingPipelineStore((store) => ({
    ...store,
    eventProcessingLog: [...store.eventProcessingLog.filter((item) => item.id !== record.id), record],
  }));
  return record;
}

export async function listDomainEvents() {
  const store = await readMailingPipelineStore();
  return store.domainEvents;
}

export async function listEventProcessingLog() {
  const store = await readMailingPipelineStore();
  return store.eventProcessingLog;
}
