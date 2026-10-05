import type { ReactNode } from "react";
import { AppShell } from "@/components/app/shell";
import { getEntitlement } from "@/server/entitlements";
import { requireSession } from "@/server/session";
import { getUsage } from "@/server/usage";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = await requireSession();
  const { plan, planId, period } = await getEntitlement(user.id);
  const { used } = await getUsage(user.id, period);

  return (
    <AppShell
      user={{ name: user.name, email: user.email }}
      plan={{ id: planId, name: plan.name }}
      usage={{ used, limit: plan.monthlySummaries }}
    >
      {children}
    </AppShell>
  );
}
