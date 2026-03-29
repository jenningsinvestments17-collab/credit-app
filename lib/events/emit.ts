import { appendDomainEvent } from "@/lib/events/store";
import { getEventBus } from "@/lib/events/registry";
import type { DomainEvent } from "@/lib/types";
import type { DomainEventInput } from "@/lib/events/types";

export function buildDomainEvent(input: DomainEventInput): DomainEvent {
  const occurredAt = new Date().toISOString();

  return {
    id: `evt_${input.type.replaceAll(".", "_")}_${occurredAt}`,
    type: input.type,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    occurredAt,
    actorType: input.actorType,
    actorId: input.actorId,
    payload: input.payload ?? {},
    metadata: input.metadata ?? {},
  };
}

export async function emitDomainEvent(input: DomainEventInput) {
  const event = buildDomainEvent(input);
  await appendDomainEvent(event);
  await getEventBus().dispatch(event);
  return event;
}
