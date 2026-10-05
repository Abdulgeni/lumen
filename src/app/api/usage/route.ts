import { handle, jsonResponse, requireApiSession } from "@/server/api/http";
import { getEntitlement } from "@/server/entitlements";
import { getUsage } from "@/server/usage";

export const GET = handle(async (request) => {
  const session = await requireApiSession(request);
  const { plan, planId, period, subscription } = await getEntitlement(session.user.id);
  const { used } = await getUsage(session.user.id, period);

  return jsonResponse({
    plan: {
      id: planId,
      name: plan.name,
      modes: plan.modes,
      sources: plan.sources,
      maxInputWords: plan.maxInputWords,
      maxFileBytes: plan.maxFileBytes,
    },
    usage: {
      used,
      limit: plan.monthlySummaries,
      remaining: Math.max(0, plan.monthlySummaries - used),
      periodEnd: period.end,
    },
    subscription: subscription
      ? {
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          currentPeriodEnd: subscription.currentPeriodEnd,
        }
      : null,
  });
});
