import { EventBus } from "@/lib/events/bus";
import {
  ALL_DOMAIN_EVENT_NAMES,
  ASYNC_REACTION_EVENT_NAMES,
  DOMAIN_EVENT_NAMES,
  WORKFLOW_PROJECTION_EVENT_NAMES,
} from "@/lib/events/eventNames";
import { notificationTriggerHandler, heavyWorkTriggerHandler } from "@/lib/events/handlers/asyncTriggers";
import { auditLifecycleHandler } from "@/lib/events/handlers/audit";
import {
  adminReadinessProjectionHandler,
  leadWorkflowProjectionHandler,
  portalProgressProjectionHandler,
} from "@/lib/events/handlers/workflowProjections";

let cachedBus: EventBus | null = null;

export function getEventBus() {
  if (cachedBus) {
    return cachedBus;
  }

  const bus = new EventBus();

  for (const eventType of ALL_DOMAIN_EVENT_NAMES) {
    bus.register(eventType, auditLifecycleHandler);
  }

  for (const eventType of WORKFLOW_PROJECTION_EVENT_NAMES) {
    bus.register(eventType, leadWorkflowProjectionHandler);
    bus.register(eventType, portalProgressProjectionHandler);
    bus.register(eventType, adminReadinessProjectionHandler);
  }

  for (const eventType of ASYNC_REACTION_EVENT_NAMES) {
    bus.register(eventType, notificationTriggerHandler);
    bus.register(eventType, heavyWorkTriggerHandler);
  }

  for (const eventType of [
    DOMAIN_EVENT_NAMES.paymentFailed,
    DOMAIN_EVENT_NAMES.paymentReauthorized,
    DOMAIN_EVENT_NAMES.paymentCaptured,
  ] as const) {
    bus.register(eventType, notificationTriggerHandler);
    bus.register(eventType, heavyWorkTriggerHandler);
    bus.register(eventType, leadWorkflowProjectionHandler);
    bus.register(eventType, portalProgressProjectionHandler);
    bus.register(eventType, adminReadinessProjectionHandler);
  }

  cachedBus = bus;
  return bus;
}
