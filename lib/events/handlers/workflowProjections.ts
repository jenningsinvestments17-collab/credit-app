import type { DomainEvent } from "@/lib/types";

export async function leadWorkflowProjectionHandler(_event: DomainEvent) {
  // Future projection hook:
  // update persisted lead workflow snapshots once lead storage moves from mock data into PostgreSQL.
}

export async function portalProgressProjectionHandler(_event: DomainEvent) {
  // Future projection hook:
  // update resume points and client dashboard progress in a durable store.
}

export async function adminReadinessProjectionHandler(_event: DomainEvent) {
  // Future projection hook:
  // update admin scan statuses and readiness views from event-driven transitions.
}
