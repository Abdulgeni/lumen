import type { PlanId } from "./plans";

export type PaidPlanId = Exclude<PlanId, "free">;
export const PAID_PLAN_IDS = ["pro", "team"] as const satisfies readonly PaidPlanId[];

export const PRICE_LOOKUP_KEYS: Record<PaidPlanId, string> = {
  pro: "lumen_pro_monthly",
  team: "lumen_team_monthly",
};

export function isPaidPlan(value: string): value is PaidPlanId {
  return value === "pro" || value === "team";
}

export function paidPlanForLookupKey(key: string | null | undefined): PaidPlanId | null {
  return PAID_PLAN_IDS.find((id) => PRICE_LOOKUP_KEYS[id] === key) ?? null;
}

const ACCESS_STATUSES = ["active", "trialing", "past_due"];

export function grantsAccess(status: string): boolean {
  return ACCESS_STATUSES.includes(status);
}

const rank = (plan: string) => (plan === "team" ? 2 : plan === "pro" ? 1 : 0);

export function pickSubscription<
  T extends { plan: string; status: string; currentPeriodEnd: Date },
>(subscriptions: readonly T[]): T | null {
  const eligible = subscriptions.filter((s) => grantsAccess(s.status) && isPaidPlan(s.plan));
  eligible.sort(
    (a, b) =>
      rank(b.plan) - rank(a.plan) || b.currentPeriodEnd.getTime() - a.currentPeriodEnd.getTime(),
  );
  return eligible[0] ?? null;
}

/** Displayed prices in USD per month. Stripe charges what its price object says; keep these in step. */
export const PLAN_PRICE_USD: Record<PaidPlanId, number> = { pro: 12, team: 39 };
