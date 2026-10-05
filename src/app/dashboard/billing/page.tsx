import { Check } from "lucide-react";
import type { Metadata } from "next";
import { Panel } from "@/components/app/panel";
import { CheckoutButton, PortalButton } from "@/components/billing/billing-actions";
import { RefreshWhilePending } from "@/components/billing/refresh-while-pending";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { isPaidPlan, PLAN_PRICE_USD } from "@/lib/billing";
import { formatDate } from "@/lib/format";
import { getPlan, PLAN_IDS, type PlanId, planFeatures } from "@/lib/plans";
import { CHECKOUT_SESSION_ID, syncCheckoutSession } from "@/server/billing/sync";
import { getEntitlement } from "@/server/entitlements";
import { requireSession } from "@/server/session";
import { getUsage } from "@/server/usage";

export const metadata: Metadata = { title: "Plan & Billing", robots: { index: false } };

function PlanCard({ id, currentId, isPaid }: { id: PlanId; currentId: PlanId; isPaid: boolean }) {
  const plan = getPlan(id);
  const current = id === currentId;
  const price = isPaidPlan(id) ? PLAN_PRICE_USD[id] : 0;

  return (
    <Panel
      className={`flex flex-col justify-between p-6 ${current ? "border-gold/50" : ""} ${id === "pro" && !current ? "gold-gradient-border" : ""}`}
    >
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-2xl font-semibold">{plan.name}</h3>
          {current ? (
            <Badge variant="gold">Current</Badge>
          ) : id === "pro" ? (
            <Badge variant="outline">Recommended</Badge>
          ) : null}
        </div>
        <p className="mb-5">
          <span className="font-display text-4xl font-semibold">
            {price === 0 ? "Free" : `$${price}`}
          </span>
          {price > 0 ? <span className="text-sm text-muted-foreground"> / month</span> : null}
        </p>
        <ul className="mb-6 space-y-2.5">
          {planFeatures(plan).map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-gold" /> {feature}
            </li>
          ))}
        </ul>
      </div>
      {current ? (
        <Button variant="outline" disabled className="w-full">
          Current plan
        </Button>
      ) : !isPaid && isPaidPlan(id) ? (
        <CheckoutButton plan={id} variant={id === "pro" ? "default" : "outline"}>
          Upgrade to {plan.name}
        </CheckoutButton>
      ) : (
        <p className="text-center text-xs text-muted-foreground">Switch plans in Manage billing.</p>
      )}
    </Panel>
  );
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; session_id?: string }>;
}) {
  const { user } = await requireSession();
  const { status, session_id: sessionId } = await searchParams;

  if (status === "success" && sessionId && CHECKOUT_SESSION_ID.test(sessionId)) {
    await syncCheckoutSession(user.id, sessionId).catch(() => undefined);
  }

  const { plan, planId, period, subscription } = await getEntitlement(user.id);
  const { used } = await getUsage(user.id, period);
  const percent =
    plan.monthlySummaries > 0 ? Math.min(100, Math.round((used / plan.monthlySummaries) * 100)) : 0;
  const isPaid = planId !== "free";

  return (
    <div className="space-y-8">
      <RefreshWhilePending active={status === "success" && planId === "free"} />

      <header className="border-b border-border pb-6">
        <h1 className="font-display text-4xl font-light tracking-tight">Plan &amp; Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and see what each plan includes.
        </p>
      </header>

      {status === "success" ? (
        <p role="status" className="text-sm text-gold-light">
          Payment received. Your plan is updating.
        </p>
      ) : null}
      {status === "cancelled" ? (
        <p role="status" className="text-sm text-muted-foreground">
          Checkout was cancelled. You have not been charged.
        </p>
      ) : null}

      <Panel className="space-y-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wider text-gold uppercase">Current plan</p>
            <h2 className="font-display text-3xl font-semibold">{plan.name}</h2>
            <p className="text-sm text-muted-foreground">
              {subscription
                ? subscription.cancelAtPeriodEnd
                  ? `Ends on ${formatDate(subscription.currentPeriodEnd)}`
                  : `Renews on ${formatDate(subscription.currentPeriodEnd)}`
                : `Quota resets on ${formatDate(period.end)}`}
            </p>
          </div>
          {isPaid ? <PortalButton>Manage billing</PortalButton> : null}
        </div>

        <div>
          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
            <span>
              {used} of {plan.monthlySummaries} summaries used
            </span>
            <span className="text-gold">{percent}%</span>
          </div>
          <Progress value={percent} label="Summaries used this period" />
        </div>

        {subscription?.cancelAtPeriodEnd ? (
          <p className="text-sm text-muted-foreground">
            Your subscription is cancelled. You keep full access until{" "}
            {formatDate(subscription.currentPeriodEnd)}.
          </p>
        ) : null}
        {subscription?.status === "past_due" ? (
          <p role="alert" className="text-sm text-red-400">
            Your last payment failed. Update your payment method in Manage billing to keep your
            plan.
          </p>
        ) : null}
      </Panel>

      <div className="grid gap-6 md:grid-cols-3">
        {PLAN_IDS.map((id) => (
          <PlanCard key={id} id={id} currentId={planId} isPaid={isPaid} />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Payments are handled securely by Stripe. Invoices and payment methods are in Manage billing.
      </p>
    </div>
  );
}
