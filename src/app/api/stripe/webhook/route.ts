import type Stripe from "stripe";
import { env } from "@/env";
import { getStripe } from "@/server/billing/stripe";
import { handleStripeEvent } from "@/server/billing/webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    const result = await handleStripeEvent(event);
    return Response.json({ received: true, result });
  } catch (error) {
    console.error(
      "[stripe] webhook failed:",
      event.type,
      error instanceof Error ? error.name : "unknown",
    );
    // A 500 makes Stripe retry later. The transaction guarantees a retry is safe.
    return new Response("Webhook handler failed", { status: 500 });
  }
}
