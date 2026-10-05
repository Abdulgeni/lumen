import type { Metadata } from "next";
import Link from "next/link";
import { BillingActions } from "@/components/billing/billing-actions";
import { RefreshWhilePending } from "@/components/billing/refresh-while-pending";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CHECKOUT_SESSION_ID, syncCheckoutSession } from "@/server/billing/sync";
import { getEntitlement } from "@/server/entitlements";
import { requireSession } from "@/server/session";
import { getUsage } from "@/server/usage";

export const metadata: Metadata = { title: "Billing", robots: { index: false } };

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" });

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

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-16">
      <RefreshWhilePending active={status === "success" && planId === "free"} />
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
        ← Dashboard
      </Link>
      <h1 className="font-display text-4xl font-light">Billing and usage</h1>

      {status === "success" ? (
        <p role="status" className="text-sm text-primary">
          Payment received. Your plan is updating.
        </p>
      ) : null}
      {status === "cancelled" ? (
        <p role="status" className="text-sm text-muted-foreground">
          Checkout was cancelled. You have not been charged.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{plan.name} plan</CardTitle>
          <CardDescription>
            {used} of {plan.monthlySummaries} summaries used this period
            {subscription
              ? `, renews or ends ${formatDate(subscription.currentPeriodEnd)}`
              : ", resets monthly"}
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription?.cancelAtPeriodEnd ? (
            <p className="text-sm text-muted-foreground">
              Your subscription is cancelled and stays active until{" "}
              {formatDate(subscription.currentPeriodEnd)}.
            </p>
          ) : null}
          {subscription?.status === "past_due" ? (
            <p role="alert" className="text-sm text-red-400">
              Your last payment failed. Update your payment method in Manage billing to keep your
              plan.
            </p>
          ) : null}
          <BillingActions isPaid={planId !== "free"} />
        </CardContent>
      </Card>
    </main>
  );
}
