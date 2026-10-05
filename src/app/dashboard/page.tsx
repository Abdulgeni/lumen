import {
  ArrowRight,
  CirclePlus,
  Clock,
  ExternalLink,
  FileText,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/app/panel";
import { UsageChart } from "@/components/app/usage-chart";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { compressionPercent, formatDate, hoursSaved } from "@/lib/format";
import { getPlan } from "@/lib/plans";
import { ROUTES, summaryHref } from "@/lib/routes";
import { MODE_LABELS } from "@/lib/summary-options";
import { getEntitlement } from "@/server/entitlements";
import { requireSession } from "@/server/session";
import { getDashboardStats } from "@/server/stats";
import { getUsage } from "@/server/usage";

export const metadata: Metadata = { title: "Overview", robots: { index: false } };

function StatCard({
  label,
  icon,
  children,
  note,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  note: string;
}) {
  return (
    <Panel className="relative overflow-hidden p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {label}
        </span>
        <span className="flex size-8 items-center justify-center rounded-xl border border-border bg-secondary text-gold">
          {icon}
        </span>
      </div>
      <div className="mb-2 flex items-baseline gap-2">{children}</div>
      <p className="text-[11px] text-muted-foreground">{note}</p>
    </Panel>
  );
}

export default async function OverviewPage() {
  const { user } = await requireSession();
  const { plan, planId, period } = await getEntitlement(user.id);
  const [{ used }, stats] = await Promise.all([
    getUsage(user.id, period),
    getDashboardStats(user.id, period),
  ]);

  const remaining = Math.max(0, plan.monthlySummaries - used);
  const saved = hoursSaved(stats.wordsIn - stats.wordsOut);
  const pro = getPlan("pro");
  const firstName = user.name.split(" ")[0] ?? user.name;
  const number = "font-display text-4xl font-semibold";

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-4xl font-light tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">Your reading, distilled.</p>
        </div>
        <Link href={ROUTES.newSummary} className={buttonVariants({ size: "lg" })}>
          <CirclePlus className="size-4" /> New Distillation
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard
          label="Monthly summaries"
          icon={<FileText className="size-4" />}
          note={`${remaining} available this period`}
        >
          <span className={number}>{used}</span>
          <span className="text-xs text-muted-foreground">/ {plan.monthlySummaries}</span>
        </StatCard>
        <StatCard
          label="Words processed"
          icon={<TrendingUp className="size-4" />}
          note={`Across ${stats.totalCount} saved ${stats.totalCount === 1 ? "summary" : "summaries"} in total`}
        >
          <span className={number}>{stats.wordsIn.toLocaleString("en-US")}</span>
          <span className="text-xs text-muted-foreground">this period</span>
        </StatCard>
        <StatCard
          label="Reading time saved"
          icon={<Clock className="size-4" />}
          note="Estimated at 220 words per minute"
        >
          <span className={`${number} gold-shimmer`}>~{saved}</span>
          <span className="text-xs text-muted-foreground">hours this period</span>
        </StatCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UsageChart days={stats.week} />
        </div>
        <Panel className="flex flex-col justify-between p-6">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="size-4 text-gold" />
              <span className="text-xs font-semibold tracking-wider text-gold uppercase">
                Your plan
              </span>
            </div>
            <h3 className="mb-2 font-display text-2xl font-semibold">
              {planId === "free" ? "Go deeper with Pro" : `${plan.name} is active`}
            </h3>
            <p className="mb-6 text-sm leading-relaxed font-light text-muted-foreground">
              {planId === "free"
                ? `Up to ${pro.monthlySummaries} summaries a month, ${pro.maxInputWords.toLocaleString("en-US")} words per document, PDF and DOCX uploads, and the Deep Dive mode.`
                : "Thank you for subscribing. Manage or change your plan any time."}
            </p>
          </div>
          <Link
            href={ROUTES.billing}
            className={buttonVariants({
              variant: planId === "free" ? "default" : "outline",
              className: "w-full",
            })}
          >
            {planId === "free" ? "See plans" : "Manage subscription"}{" "}
            <ArrowRight className="size-3.5" />
          </Link>
        </Panel>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Recent summaries</h2>
            <p className="text-xs text-muted-foreground">Your latest saved work</p>
          </div>
          <Link
            href={ROUTES.archive}
            className="flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-light"
          >
            View archive <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {stats.recent.length === 0 ? (
          <Panel className="p-12 text-center">
            <FileText className="mx-auto mb-3 size-10 text-gold/40" />
            <h3 className="mb-1 text-base font-semibold">No summaries yet</h3>
            <p className="mx-auto mb-6 max-w-sm text-sm text-muted-foreground">
              Paste text or a link to get your first distilled brief.
            </p>
            <Link href={ROUTES.newSummary} className={buttonVariants({ size: "sm" })}>
              Create your first summary
            </Link>
          </Panel>
        ) : (
          <Panel className="divide-y divide-border overflow-hidden">
            {stats.recent.map((s) => {
              const condensed = compressionPercent(s.inputWords, s.outputWords);
              return (
                <div
                  key={s.id}
                  className="flex flex-col justify-between gap-3 p-5 transition-colors hover:bg-secondary/50 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={summaryHref(s.id)}
                        className="text-sm font-semibold transition-colors hover:text-gold-light"
                      >
                        {s.title}
                      </Link>
                      <Badge variant="outline">{MODE_LABELS[s.mode]}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.inputWords > 0
                        ? `${s.inputWords.toLocaleString("en-US")} → ${s.outputWords} words`
                        : s.sourceType.toLowerCase()}
                      {condensed !== null ? (
                        <span className="text-gold"> · {condensed}% condensed</span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(s.createdAt)}
                    </span>
                    <Link
                      href={summaryHref(s.id)}
                      aria-label={`Open ${s.title}`}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "icon",
                        className: "size-8",
                      })}
                    >
                      <ExternalLink className="size-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </Panel>
        )}
      </section>
    </div>
  );
}
