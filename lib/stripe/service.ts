import Stripe from "stripe";
import { env } from "@/lib/env";
import type { PaymentRecord } from "@/lib/types";

let stripeClient: Stripe | null = null;

export function getStripeSecretKey() {
  return env.STRIPE_SECRET_KEY;
}

export function getStripeWebhookSecret() {
  return env.STRIPE_WEBHOOK_SECRET;
}

export function isStripeConfigured() {
  return Boolean(getStripeSecretKey());
}

export function getStripeClient() {
  const secretKey = getStripeSecretKey();

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2026-03-25.dahlia",
    });
  }

  return stripeClient;
}

export function resolveAppBaseUrl(origin?: string) {
  return (origin || env.NEXT_PUBLIC_APP_URL || env.APP_BASE_URL).replace(/\/$/, "");
}

export function validateStripeWebhookSignature(payload: string, signature: string | null) {
  const webhookSecret = getStripeWebhookSecret();

  if (!signature || !webhookSecret) {
    throw new Error("Stripe webhook signature configuration is missing.");
  }

  return getStripeClient().webhooks.constructEvent(payload, signature, webhookSecret);
}

export function isPaymentSettled(record: PaymentRecord | null) {
  return Boolean(record && record.status === "captured");
}

export function isPaymentAuthorized(record: PaymentRecord | null) {
  return Boolean(
    record && (record.status === "authorized" || record.status === "ready_to_capture"),
  );
}

export function isAuthorizationExpired(record: PaymentRecord | null) {
  if (!record?.authorizationExpiresAt) {
    return false;
  }

  return Date.now() > new Date(record.authorizationExpiresAt).getTime();
}

export function requiresPaymentMethodUpdate(record: PaymentRecord | null) {
  return Boolean(
    !record ||
      record.status === "payment_not_collected" ||
      record.status === "payment_required" ||
      record.status === "authorization_expired" ||
      record.status === "payment_failed",
  );
}

export function buildStripeIntentIds(disputeId: string) {
  const token = Date.now();

  return {
    checkoutSessionId: `cs_test_${disputeId}_${token}`,
    paymentIntentId: `pi_test_${disputeId}_${token}`,
  };
}
