import type Stripe from "stripe";
import { findWebhookEventByEventId, upsertWebhookEvent } from "@/lib/db/webhooks";
import {
  authorizeMailingPayment,
  captureMailingPayment,
  markMailingPaymentFailure,
} from "@/lib/mailing/service";
import { handlePaymentAutomation } from "@/lib/services/paymentService";
import { enqueueTrackingReconciliation, processTrackingReconciliationJob } from "@/lib/services/mailingService";

function extractDisputeId(event: Stripe.Event) {
  const object = event.data.object as Stripe.PaymentIntent | Stripe.Checkout.Session;
  const metadata = "metadata" in object ? object.metadata : undefined;
  return metadata?.disputeId;
}

export async function handleStripeWebhook(event: Stripe.Event) {
  const disputeId = extractDisputeId(event);
  const existing = event.id
    ? await findWebhookEventByEventId("stripe", event.id)
    : null;

  if (existing?.status === "processed") {
    return { received: true, skipped: true, duplicate: true };
  }

  await upsertWebhookEvent({
    provider: "stripe",
    eventId: event.id,
    eventType: event.type,
    disputeId: disputeId ?? null,
    signatureValid: true,
    payload: {
      objectId: (event.data.object as { id?: string }).id ?? null,
      livemode: event.livemode,
      created: event.created,
    },
    status: "processing",
  });

  if (!disputeId) {
    await upsertWebhookEvent({
      provider: "stripe",
      eventId: event.id,
      eventType: event.type,
      signatureValid: true,
      status: "processed",
      processedAt: new Date(),
      payload: {
        objectId: (event.data.object as { id?: string }).id ?? null,
        livemode: event.livemode,
        created: event.created,
      },
    });
    return { received: true, skipped: true };
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "payment_intent.amount_capturable_updated"
    ) {
      await authorizeMailingPayment(disputeId, event.type);
      await handlePaymentAutomation(disputeId);
    }

    if (event.type === "payment_intent.succeeded") {
      await captureMailingPayment(disputeId, event.type);
      await handlePaymentAutomation(disputeId);
    }

    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as Stripe.PaymentIntent;
      await markMailingPaymentFailure(
        disputeId,
        intent.last_payment_error?.message ?? "Stripe reported a failed payment attempt.",
        event.type,
      );
    }

    if (event.type === "charge.updated") {
      const charge = event.data.object as Stripe.Charge;
      const trackingNumber = charge.metadata?.tracking_number;
      if (trackingNumber) {
        await enqueueTrackingReconciliation({
          disputeId,
          trackingNumber,
          deliveryStatus: charge.metadata?.delivery_status === "delivered" ? "delivered" : "in_transit",
        });
        await processTrackingReconciliationJob({
          payload: {
            disputeId,
            trackingNumber,
            deliveryStatus: charge.metadata?.delivery_status === "delivered" ? "delivered" : "in_transit",
          },
        });
      }
    }

    await upsertWebhookEvent({
      provider: "stripe",
      eventId: event.id,
      eventType: event.type,
      disputeId,
      signatureValid: true,
      status: "processed",
      processedAt: new Date(),
      payload: {
        objectId: (event.data.object as { id?: string }).id ?? null,
        livemode: event.livemode,
        created: event.created,
      },
    });
  } catch (error) {
    await upsertWebhookEvent({
      provider: "stripe",
      eventId: event.id,
      eventType: event.type,
      disputeId,
      signatureValid: true,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Stripe webhook processing failed.",
      payload: {
        objectId: (event.data.object as { id?: string }).id ?? null,
        livemode: event.livemode,
        created: event.created,
      },
    });
    throw error;
  }

  return { received: true };
}
