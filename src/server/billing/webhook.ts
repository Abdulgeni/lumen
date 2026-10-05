import Stripe from "stripe";
import { paidPlanForLookupKey } from "@/lib/billing";
import type { PrismaClient } from "../../generated/prisma/client";
import { db } from "../db";
import { getStripe } from "./stripe";

type SyncClient = Pick<PrismaClient, "billingCustomer" | "subscription">;

/** Stores Stripe's current view of a subscription. Safe to run any number of times, in any order. */
export async function upsertSubscription(
  client: SyncClient,
  sub: Stripe.Subscription,
): Promise<"synced" | "ignored"> {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const owner = await client.billingCustomer.findUnique({
    where: { stripeCustomerId: customerId },
    select: { userId: true },
  });
  if (!owner) {
    console.warn("[stripe] subscription for an unknown customer, ignoring");
    return "ignored";
  }

  const item = sub.items.data[0];
  const plan = paidPlanForLookupKey(item?.price.lookup_key);
  if (!item || !plan) {
    console.warn("[stripe] subscription with an unrecognised price, ignoring");
    return "ignored";
  }

  const data = {
    stripeCustomerId: customerId,
    plan,
    status: sub.status,
    currentPeriodStart: new Date(item.current_period_start * 1000),
    currentPeriodEnd: new Date(item.current_period_end * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
  };
  await client.subscription.upsert({
    where: { id: sub.id },
    create: { id: sub.id, userId: owner.userId, ...data },
    update: data,
  });
  return "synced";
}

const SUBSCRIPTION_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
]);

function subscriptionIdFor(event: Stripe.Event): string | null {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.mode !== "subscription" || !session.subscription) return null;
    return typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;
  }
  if (SUBSCRIPTION_EVENTS.has(event.type)) return (event.data.object as Stripe.Subscription).id;
  return null;
}

export type WebhookDeps = {
  retrieveSubscription: (id: string) => Promise<Stripe.Subscription | null>;
  sync: (client: SyncClient, sub: Stripe.Subscription) => Promise<unknown>;
};

const defaultDeps: WebhookDeps = {
  retrieveSubscription: async (id) => {
    try {
      return await getStripe().subscriptions.retrieve(id);
    } catch (error) {
      if (
        error instanceof Stripe.errors.StripeInvalidRequestError &&
        error.code === "resource_missing"
      ) {
        return null;
      }
      throw error;
    }
  },
  sync: upsertSubscription,
};

export type HandleResult = "processed" | "duplicate" | "ignored";

/**
 * 1. Work out which subscription the event concerns; ignore everything else.
 * 2. Fetch that subscription's current state from Stripe (so event order never matters).
 * 3. In ONE transaction: claim the event id, then store the state. If either step fails the
 *    claim rolls back, so Stripe's retry will work. If two copies race, exactly one claims it.
 */
export async function handleStripeEvent(
  event: Stripe.Event,
  deps: WebhookDeps = defaultDeps,
): Promise<HandleResult> {
  const subscriptionId = subscriptionIdFor(event);
  if (!subscriptionId) return "ignored";

  const seen = await db.stripeEvent.findUnique({ where: { id: event.id }, select: { id: true } });
  if (seen) return "duplicate";

  const subscription = await deps.retrieveSubscription(subscriptionId);

  return db.$transaction(
    async (tx) => {
      const claimed = await tx.stripeEvent.createMany({
        data: [{ id: event.id, type: event.type }],
        skipDuplicates: true,
      });
      if (claimed.count === 0) return "duplicate" as const;
      if (subscription) await deps.sync(tx, subscription);
      return "processed" as const;
    },
    {
      // Neon's pooled connections can be slow to hand out; 8 concurrent claims need time.
      maxWait: 15_000,
      timeout: 30_000,
    },
  );
}
