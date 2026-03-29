import { getStripeClient } from "@/lib/stripe/service";

export async function createMailingCheckout(input: {
  disputeId: string;
  leadId: string;
  leadEmail: string;
  amountCents: number;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.leadEmail,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: input.amountCents,
          product_data: {
            name: "Certified Mailing Service Fee",
            description:
              "Preauthorization for the final $405 dispute mailing and release workflow.",
          },
        },
      },
    ],
    metadata: {
      disputeId: input.disputeId,
      leadId: input.leadId,
      purpose: "mailing_preauthorization",
    },
    payment_intent_data: {
      capture_method: "manual",
      description: `Mailing preauthorization for dispute ${input.disputeId}`,
      metadata: {
        disputeId: input.disputeId,
        leadId: input.leadId,
        purpose: "mailing_preauthorization",
      },
    },
  });

  return {
    checkoutSessionId: session.id,
    paymentIntentId:
      typeof session.payment_intent === "string" ? session.payment_intent : undefined,
    updatePaymentMethodUrl: session.url ?? input.cancelUrl,
    hostedUrl: session.url ?? input.successUrl,
    cancelUrl: input.cancelUrl,
  };
}
