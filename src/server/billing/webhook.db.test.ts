import type Stripe from "stripe";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../db";
import { getEntitlement } from "../entitlements";
import { handleStripeEvent, upsertSubscription, type WebhookDeps } from "./webhook";

const stamp = Date.now();
const userId = `billtest_${stamp}`;
const customerId = `cus_test_${stamp}`;
const DAY = 86_400;
const nowSec = Math.floor(Date.now() / 1000);

function sub(
  overrides: {
    id?: string;
    status?: string;
    lookupKey?: string | null;
    cancelAtPeriodEnd?: boolean;
    customer?: string;
  } = {},
) {
  return {
    id: overrides.id ?? `sub_${stamp}`,
    customer: overrides.customer ?? customerId,
    status: overrides.status ?? "active",
    cancel_at_period_end: overrides.cancelAtPeriodEnd ?? false,
    canceled_at: null,
    items: {
      data: [
        {
          price: {
            lookup_key:
              overrides.lookupKey === undefined ? "lumen_pro_monthly" : overrides.lookupKey,
          },
          current_period_start: nowSec - 5 * DAY,
          current_period_end: nowSec + 25 * DAY,
        },
      ],
    },
  } as unknown as Stripe.Subscription;
}

const subscriptionEvent = (
  id: string,
  subscriptionId = `sub_${stamp}`,
  type = "customer.subscription.updated",
) => ({ id, type, data: { object: { id: subscriptionId } } }) as unknown as Stripe.Event;

const depsFor = (current: Stripe.Subscription | null): WebhookDeps => ({
  retrieveSubscription: async () => current,
  sync: upsertSubscription,
});

beforeAll(async () => {
  await db.user.create({
    data: { id: userId, name: "Billing test", email: `${userId}@example.com` },
  });
  await db.billingCustomer.create({ data: { userId, stripeCustomerId: customerId } });
});

beforeEach(async () => {
  await db.subscription.deleteMany({ where: { userId } });
  await db.stripeEvent.deleteMany({ where: { id: { startsWith: `evt_${stamp}` } } });
});

afterAll(async () => {
  await db.stripeEvent.deleteMany({ where: { id: { startsWith: `evt_${stamp}` } } });
  await db.user.deleteMany({ where: { id: userId } });
  await db.$disconnect();
});

describe("handleStripeEvent", () => {
  it("stores the subscription and upgrades the user's plan", async () => {
    const result = await handleStripeEvent(subscriptionEvent(`evt_${stamp}_1`), depsFor(sub()));
    expect(result).toBe("processed");

    const entitlement = await getEntitlement(userId);
    expect(entitlement.planId).toBe("pro");
    expect(entitlement.plan.monthlySummaries).toBe(300);
    expect(entitlement.subscription).toMatchObject({ status: "active", cancelAtPeriodEnd: false });
  });

  it("treats a repeated event as a duplicate", async () => {
    const event = subscriptionEvent(`evt_${stamp}_2`);
    expect(await handleStripeEvent(event, depsFor(sub()))).toBe("processed");
    expect(await handleStripeEvent(event, depsFor(sub()))).toBe("duplicate");
  });

  it("processes an event exactly once when copies arrive in parallel", async () => {
    const event = subscriptionEvent(`evt_${stamp}_3`);
    const results = await Promise.all(
      Array.from({ length: 8 }, () => handleStripeEvent(event, depsFor(sub()))),
    );
    expect(results.filter((r) => r === "processed")).toHaveLength(1);
    expect(results.filter((r) => r === "duplicate")).toHaveLength(7);
    expect(await db.subscription.count({ where: { userId } })).toBe(1);
  });

  it("does not consume the event when processing fails, so a retry succeeds", async () => {
    const event = subscriptionEvent(`evt_${stamp}_4`);
    const broken: WebhookDeps = {
      retrieveSubscription: async () => sub(),
      sync: async () => {
        throw new Error("database exploded");
      },
    };
    await expect(handleStripeEvent(event, broken)).rejects.toThrow("database exploded");
    expect(await db.stripeEvent.count({ where: { id: event.id } })).toBe(0);

    expect(await handleStripeEvent(event, depsFor(sub()))).toBe("processed");
    expect((await getEntitlement(userId)).planId).toBe("pro");
  });

  it("downgrades to Free when the subscription is canceled", async () => {
    await handleStripeEvent(subscriptionEvent(`evt_${stamp}_5`), depsFor(sub()));
    await handleStripeEvent(
      subscriptionEvent(`evt_${stamp}_6`, undefined, "customer.subscription.deleted"),
      depsFor(sub({ status: "canceled" })),
    );
    expect((await getEntitlement(userId)).planId).toBe("free");
  });

  it("keeps access while payment is past due, and removes it when unpaid", async () => {
    await handleStripeEvent(
      subscriptionEvent(`evt_${stamp}_7`),
      depsFor(sub({ status: "past_due" })),
    );
    expect((await getEntitlement(userId)).planId).toBe("pro");
    await handleStripeEvent(
      subscriptionEvent(`evt_${stamp}_8`),
      depsFor(sub({ status: "unpaid" })),
    );
    expect((await getEntitlement(userId)).planId).toBe("free");
  });

  it("keeps access until the period ends after a cancellation is scheduled", async () => {
    await handleStripeEvent(
      subscriptionEvent(`evt_${stamp}_9`),
      depsFor(sub({ cancelAtPeriodEnd: true })),
    );
    const entitlement = await getEntitlement(userId);
    expect(entitlement.planId).toBe("pro");
    expect(entitlement.subscription?.cancelAtPeriodEnd).toBe(true);
  });

  it("gives the highest tier when several subscriptions exist", async () => {
    await handleStripeEvent(
      subscriptionEvent(`evt_${stamp}_10`, `sub_${stamp}_a`),
      depsFor(sub({ id: `sub_${stamp}_a` })),
    );
    await handleStripeEvent(
      subscriptionEvent(`evt_${stamp}_11`, `sub_${stamp}_b`),
      depsFor(sub({ id: `sub_${stamp}_b`, lookupKey: "lumen_team_monthly" })),
    );
    expect((await getEntitlement(userId)).planId).toBe("team");
  });

  it("ignores unrecognised prices and customers that are not ours", async () => {
    await handleStripeEvent(
      subscriptionEvent(`evt_${stamp}_12`),
      depsFor(sub({ lookupKey: "some_other_price" })),
    );
    await handleStripeEvent(
      subscriptionEvent(`evt_${stamp}_13`),
      depsFor(sub({ customer: "cus_stranger" })),
    );
    expect(await db.subscription.count({ where: { userId } })).toBe(0);
    expect((await getEntitlement(userId)).planId).toBe("free");
  });

  it("only acts on subscription checkouts and subscription events", async () => {
    const payment = {
      id: `evt_${stamp}_14`,
      type: "checkout.session.completed",
      data: { object: { mode: "payment", subscription: null } },
    } as unknown as Stripe.Event;
    const unrelated = {
      id: `evt_${stamp}_15`,
      type: "invoice.created",
      data: { object: {} },
    } as unknown as Stripe.Event;
    expect(await handleStripeEvent(payment, depsFor(sub()))).toBe("ignored");
    expect(await handleStripeEvent(unrelated, depsFor(sub()))).toBe("ignored");
    expect(
      await db.stripeEvent.count({
        where: { id: { startsWith: `evt_${stamp}_1` }, type: { in: ["invoice.created"] } },
      }),
    ).toBe(0);

    const checkout = {
      id: `evt_${stamp}_16`,
      type: "checkout.session.completed",
      data: { object: { mode: "subscription", subscription: `sub_${stamp}` } },
    } as unknown as Stripe.Event;
    expect(await handleStripeEvent(checkout, depsFor(sub()))).toBe("processed");
  });
});
