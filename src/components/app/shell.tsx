"use client";

import {
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  CreditCard,
  FileText,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Progress } from "@/components/ui/progress";
import { APP_NAME, ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";

const NAV = [
  { label: "Overview", href: ROUTES.dashboard, icon: LayoutDashboard, exact: true },
  { label: "New Distillation", href: ROUTES.newSummary, icon: CirclePlus, exact: false },
  { label: "Archive", href: ROUTES.archive, icon: FileText, exact: false },
  { label: "Plan & Billing", href: ROUTES.billing, icon: CreditCard, exact: false },
  { label: "Settings", href: ROUTES.settings, icon: Settings, exact: false },
] as const;

function crumb(pathname: string): string {
  if (pathname.startsWith(ROUTES.newSummary)) return "New Distillation";
  if (pathname.startsWith(`${ROUTES.archive}/`)) return "Summary";
  if (pathname.startsWith(ROUTES.archive)) return "Archive";
  if (pathname.startsWith(ROUTES.billing)) return "Plan & Billing";
  if (pathname.startsWith(ROUTES.settings)) return "Settings";
  return "Overview";
}

type ShellProps = {
  user: { name: string; email: string };
  plan: { id: string; name: string };
  usage: { used: number; limit: number };
  children: ReactNode;
};

function NavLinks({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1.5 p-3" aria-label="Main">
      {NAV.map(({ label, href, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "border-gold/30 bg-secondary text-gold-light shadow-[0_0_15px_rgba(200,169,106,0.1)]"
                : "border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                active ? "text-gold" : "group-hover:text-foreground",
              )}
            />
            {collapsed ? <span className="sr-only">{label}</span> : <span>{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function UsageWidget({ plan, usage }: Pick<ShellProps, "plan" | "usage">) {
  const percent = usage.limit > 0 ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold">Monthly quota</span>
        <Badge variant={plan.id === "free" ? "outline" : "gold"}>{plan.name}</Badge>
      </div>
      <div>
        <div className="mb-1.5 flex justify-between text-[11px] text-muted-foreground">
          <span>
            {usage.used} / {usage.limit} summaries
          </span>
          <span className="font-semibold text-gold">{percent}%</span>
        </div>
        <Progress value={percent} label="Monthly summaries used" />
      </div>
      {plan.id === "free" ? (
        <Link
          href={ROUTES.billing}
          className={buttonVariants({ size: "sm", className: "h-8 w-full text-xs" })}
        >
          <Sparkles className="size-3" /> Upgrade
        </Link>
      ) : null}
    </div>
  );
}

export function AppShell({ user, plan, usage, children }: ShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <aside
        className={cn(
          "sticky top-0 z-20 hidden h-dvh flex-col justify-between border-r border-border bg-background transition-all duration-300 lg:flex",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <div>
          <div className="flex h-16 items-center justify-between border-b border-border px-5">
            <Link
              href={ROUTES.dashboard}
              className="flex items-center gap-2.5"
              aria-label={`${APP_NAME} overview`}
            >
              <span className="flex size-8 items-center justify-center rounded-xl border border-gold/40 bg-secondary shadow-[0_0_12px_rgba(200,169,106,0.15)]">
                <span className="font-display text-base font-semibold text-gold-light">L</span>
              </span>
              {collapsed ? null : (
                <span className="font-display text-xl font-semibold tracking-tight">
                  {APP_NAME}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </button>
          </div>
          <NavLinks collapsed={collapsed} />
        </div>
        <div className="border-t border-border p-3">
          {collapsed ? (
            <div className="flex justify-center" title={`${usage.used}/${usage.limit} used`}>
              <span className="flex size-9 items-center justify-center rounded-xl border border-gold/30 bg-secondary text-gold">
                <Zap className="size-4" />
              </span>
            </div>
          ) : (
            <UsageWidget plan={plan} usage={usage} />
          )}
        </div>
      </aside>

      <Modal open={drawerOpen} onClose={() => setDrawerOpen(false)} title={APP_NAME} side="left">
        <NavLinks collapsed={false} onNavigate={() => setDrawerOpen(false)} />
        <div className="mt-4">
          <UsageWidget plan={plan} usage={usage} />
        </div>
      </Modal>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <Link
                href={ROUTES.dashboard}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {APP_NAME}
              </Link>
              <ChevronRight className="size-3 text-muted-foreground/50" />
              <span className="font-semibold">{crumb(pathname)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <form
              action={ROUTES.archive}
              method="get"
              role="search"
              className="relative hidden sm:block"
            >
              <label htmlFor="topbar-search" className="sr-only">
                Search your archive
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-gold" />
              <input
                id="topbar-search"
                name="q"
                type="search"
                placeholder="Search your archive"
                maxLength={100}
                className="h-9 w-56 rounded-xl border border-foreground/10 bg-secondary/60 pr-3 pl-9 text-sm text-foreground transition-all outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/50 lg:w-72"
              />
            </form>
            <UserMenu name={user.name} email={user.email} planName={plan.name} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
