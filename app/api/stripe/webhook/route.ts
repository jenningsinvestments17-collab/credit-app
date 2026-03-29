import { NextRequest, NextResponse } from "next/server";
import { handleStripeWebhook } from "@/lib/stripe/handleWebhook";
import { jsonError } from "@/lib/security/api";
import { validateStripeWebhookSignature } from "@/lib/stripe/service";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (payload.length > 1024 * 1024) {
    return jsonError("Webhook payload too large.", 413);
  }

  try {
    const event = validateStripeWebhookSignature(payload, signature);
    const result = await handleStripeWebhook(event);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "production"
            ? "Invalid webhook request."
            : error instanceof Error
              ? error.message
              : "Invalid webhook request.",
      },
      { status: 400 },
    );
  }
}
