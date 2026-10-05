import type { Metadata } from "next";
import { Workspace } from "@/components/workspace/workspace";
import { getEntitlement } from "@/server/entitlements";
import { getPreferences } from "@/server/preferences";
import { requireSession } from "@/server/session";
import { getUsage } from "@/server/usage";
import { toLanguageCode } from "@/lib/summary-options";

export const metadata: Metadata = { title: "New Distillation", robots: { index: false } };

export default async function NewSummaryPage() {
  const { user } = await requireSession();
  const { plan, planId, period } = await getEntitlement(user.id);
  const [{ used }, prefs] = await Promise.all([getUsage(user.id, period), getPreferences(user.id)]);

  const modes = [...plan.modes];
  const mode = modes.includes(prefs.defaultMode)
    ? prefs.defaultMode
    : (modes[0] ?? "EXECUTIVE_BRIEF");

  return (
    <Workspace
      plan={{
        id: planId,
        name: plan.name,
        modes,
        sources: [...plan.sources],
        maxInputWords: plan.maxInputWords,
        maxFileBytes: plan.maxFileBytes,
      }}
      usage={{ used, limit: plan.monthlySummaries }}
      defaults={{
        mode,
        length: prefs.defaultLength,
        tone: prefs.defaultTone,
        language: toLanguageCode(prefs.outputLanguage),
      }}
    />
  );
}
