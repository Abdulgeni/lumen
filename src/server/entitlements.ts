import { isPaidPlan, pickSubscription } from "../lib/billing";
import { calendarMonthPeriod, type Period, resolvePeriod } from "../lib/period";
import { getPlan, type PlanConfig, type PlanId } from "../lib/plans";
import { db } from "./db";

export type SubscriptionInfo = {
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date;
};

export type Entitlement = {
  planId: PlanId;
  plan: PlanConfig;
  period: Period;
  subscription?: SubscriptionInfo | null;
};

/** A user's plan, derived from their Stripe subscription as last synced by the webhook. */
export async function getEntitlement(userId: string, now: Date = new Date()): Promise<Entitlement> {
  const subscriptions = await db.subscription.findMany({
    where: { userId },
    select: {
      plan: true,
      status: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
    },
  });

  const active = pickSubscription(subscriptions);
  if (!active || !isPaidPlan(active.plan)) {
    return {
      planId: "free",
      plan: getPlan("free"),
      period: calendarMonthPeriod(now),
      subscription: null,
    };
  }
  return {
    planId: active.plan,
    plan: getPlan(active.plan),
    period: resolvePeriod(
      { periodStart: active.currentPeriodStart, periodEnd: active.currentPeriodEnd },
      now,
    ),
    subscription: {
      status: active.status,
      cancelAtPeriodEnd: active.cancelAtPeriodEnd,
      currentPeriodEnd: active.currentPeriodEnd,
    },
  };
}
