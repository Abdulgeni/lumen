import { db } from "../db";
import { getStripe } from "./stripe";
import { upsertSubscription } from "./webhook";

export const CHECKOUT_SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]+$/;

/** Updates the plan immediately on return from Checkout, without waiting for the webhook. */
export async function syncCheckoutSession(userId: string, sessionId: string): Promise<void> {
  const owner = await db.billingCustomer.findUnique({ where: { userId } });
  if (!owner) return;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  // Only ever sync sessions that belong to this user's own customer.
  if (customerId !== owner.stripeCustomerId) return;
  if (session.mode !== "subscription" || !session.subscription) return;

  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription.id;
  await upsertSubscription(db, await stripe.subscriptions.retrieve(subscriptionId));
}
