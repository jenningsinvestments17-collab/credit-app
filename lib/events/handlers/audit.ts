import type { DomainEvent } from "@/lib/types";

export async function auditLifecycleHandler(_event: DomainEvent) {
  // Persistence is handled centrally by the event store.
  // This handler exists as the stable hook for future audit fan-out.
}
