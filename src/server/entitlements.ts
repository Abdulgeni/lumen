import { calendarMonthPeriod, type Period } from "../lib/period";
import { getPlan, type PlanConfig, type PlanId } from "../lib/plans";

export type Entitlement = { planId: PlanId; plan: PlanConfig; period: Period };

/**
 * Until Stripe is connected in Loop 6, every account is on the Free plan. That is the
 * real state of the system, not a mock: no paid subscription can exist yet.
 */
export async function getEntitlement(userId: string): Promise<Entitlement> {
  void userId;
  const planId: PlanId = "free";
  return { planId, plan: getPlan(planId), period: calendarMonthPeriod() };
}
