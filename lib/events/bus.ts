import type { DomainEvent, DomainEventType, EventProcessingLogRecord } from "@/lib/types";
import type { DomainEventHandler } from "@/lib/events/types";
import { appendEventProcessingLog } from "@/lib/events/store";

type HandlerRegistry = Map<DomainEventType, DomainEventHandler[]>;

export class EventBus {
  private handlers: HandlerRegistry = new Map();

  register(eventType: DomainEventType, handler: DomainEventHandler) {
    const existing = this.handlers.get(eventType) ?? [];
    this.handlers.set(eventType, [...existing, handler]);
  }

  async dispatch(event: DomainEvent) {
    const handlers = this.handlers.get(event.type) ?? [];

    for (const handler of handlers) {
      const handlerName = handler.name || "anonymous_handler";
      const processedAt = new Date().toISOString();

      try {
        await handler(event);
        const log: EventProcessingLogRecord = {
          id: `eventlog_${event.id}_${handlerName}_${processedAt}`,
          eventId: event.id,
          handlerName,
          status: "processed",
          processedAt,
        };
        await appendEventProcessingLog(log);
      } catch (error) {
        const log: EventProcessingLogRecord = {
          id: `eventlog_${event.id}_${handlerName}_${processedAt}`,
          eventId: event.id,
          handlerName,
          status: "failed",
          processedAt,
          notes: error instanceof Error ? error.message : "Unknown handler failure",
        };
        await appendEventProcessingLog(log);
        throw error;
      }
    }
  }
}
