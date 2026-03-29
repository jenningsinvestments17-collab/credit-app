import type { DomainActorType, DomainAggregateType, DomainEvent, DomainEventType } from "@/lib/types";

export type DomainEventHandler = (event: DomainEvent) => Promise<void> | void;

export type DomainEventInput = {
  type: DomainEventType;
  aggregateType: DomainAggregateType;
  aggregateId: string;
  actorType: DomainActorType;
  actorId: string;
  payload?: Record<string, unknown>;
  metadata?: Record<string, string>;
};
