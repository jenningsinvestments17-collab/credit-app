import { DOMAIN_EVENT_NAMES } from "@/lib/events/eventNames";
import type { DomainEvent } from "@/lib/types";

function getPayloadString(event: DomainEvent, key: string) {
  const value = event.payload[key];
  return typeof value === "string" ? value : null;
}

export async function notificationTriggerHandler(event: DomainEvent) {
  switch (event.type) {
    case DOMAIN_EVENT_NAMES.paymentFailed:
      // Future async hook:
      // queue client payment-update notice + admin failure alert.
      return;
    case DOMAIN_EVENT_NAMES.mailingPaymentCompleted:
      // Future async hook:
      // queue confirmation that mailing payment is secured and the file can move forward.
      return;
    default:
      // Future async hook:
      // queue mail/SMS notifications in response to workflow events.
      return;
  }
}

export async function heavyWorkTriggerHandler(event: DomainEvent) {
  switch (event.type) {
    case DOMAIN_EVENT_NAMES.contractSigned: {
      const disputeId = getPayloadString(event, "disputeId");
      if (disputeId) {
        const { ensurePaymentMethodCollectionReady } = await import("@/lib/mailing/service");
        await ensurePaymentMethodCollectionReady(disputeId, event.actorId);
      }
      return;
    }
    case DOMAIN_EVENT_NAMES.disputeFinalPdfGenerated: {
      const disputeId = event.aggregateType === "dispute" ? event.aggregateId : null;
      if (disputeId) {
        const { ensureFinalPaymentRequestOpen } = await import("@/lib/mailing/service");
        await ensureFinalPaymentRequestOpen(disputeId, event.actorId);
      }
      return;
    }
    case DOMAIN_EVENT_NAMES.mailingPaymentCompleted:
      // Future async hook:
      // queue provider-prep work once the final payment gate is satisfied.
      return;
    case DOMAIN_EVENT_NAMES.paymentFailed:
      // Future async hook:
      // schedule retry reminders / payment-method refresh follow-ups.
      return;
    default:
      // Future async hook:
      // queue AI review, PDF generation, and provider submission work onto background workers.
      return;
  }
}
