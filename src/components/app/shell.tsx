"use client";

import {
  ChevronRight,
  CirclePlus,
  CreditCard,
  FileText,
  LayoutDashboard,
  Menu,
  Pin,
  Search,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
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

/** Widths in pixels. Collapsed keeps icons visible; expanded reveals the labels. */
const WIDTH_COLLAPSED = 72;
const WIDTH_EXPANDED = 256;

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

function NavLinks({ expanded, onNavigate }: { expanded: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1.5 px-3 py-3" aria-label="Main">
      {NAV.map(({ label, href, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            title={expanded ? undefined : label}
            aria-current={active ? "page" : undefined}
            aria-label={expanded ? undefined : label}
            className={cn(
              "group flex items-center rounded-xl border text-sm font-medium transition-colors duration-200",
              expanded ? "gap-3 px-3.5 py-2.5" : "h-11 justify-center",
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
            {expanded ? <span className="truncate">{label}</span> : null}
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [pinned, setPinned] = useState(false);
  const leaveTimer = useRef<number | null>(null);

  // The sidebar expands when hovered or pinned. Everything else follows from this.
  const expanded = hovering || pinned;

  // Grace period so a brief pointer exit does not collapse the sidebar.
  function onEnter() {
    if (leaveTimer.current !== null) {
      window.clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    setHovering(true);
  }

  function onLeave() {
    if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => {
      setHovering(false);
      leaveTimer.current = null;
    }, 200);
  }

  useEffect(() => {
    return () => {
      if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current);
    };
  }, []);

  const sidebarWidth = expanded ? WIDTH_EXPANDED : WIDTH_COLLAPSED;

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <aside
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        style={{ width: sidebarWidth }}
        aria-label="Primary"
        className="fixed top-0 left-0 z-40 hidden h-dvh flex-col justify-between overflow-hidden border-r border-border bg-background shadow-[2px_0_12px_rgba(0,0,0,0.35)] transition-[width] duration-300 ease-out lg:flex"
      >
        <div>
          {/* Header: logo mark always visible; wordmark and pin only when expanded. */}
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <Link
              href={ROUTES.dashboard}
              className="flex min-w-0 items-center gap-2.5"
              aria-label={`${APP_NAME} overview`}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-gold/40 bg-secondary shadow-[0_0_12px_rgba(200,169,106,0.15)]">
                <span className="font-display text-base font-semibold text-gold-light">L</span>
              </span>
              <span
                className={cn(
                  "truncate font-display text-xl font-semibold tracking-tight transition-opacity duration-200",
                  expanded ? "opacity-100" : "pointer-events-none opacity-0",
                )}
              >
                {APP_NAME}
              </span>
            </Link>
            {expanded ? (
              <button
                type="button"
                onClick={() => setPinned((v) => !v)}
                aria-label={pinned ? "Unpin sidebar" : "Pin sidebar open"}
                aria-pressed={pinned}
                className={cn(
                  "shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  pinned && "bg-secondary text-gold-light",
                )}
              >
                <Pin className={cn("size-3.5", pinned && "fill-current")} />
              </button>
            ) : null}
          </div>

          <NavLinks expanded={expanded} />
        </div>

        {/* Footer: compact icon when collapsed, full usage widget when expanded. */}
        <div className="border-t border-border p-3">
          {expanded ? (
            <UsageWidget plan={plan} usage={usage} />
          ) : (
            <div className="flex justify-center">
              <span
                title={`${usage.used}/${usage.limit} used`}
                className="flex size-9 items-center justify-center rounded-xl border border-gold/30 bg-secondary text-gold"
              >
                <Zap className="size-4" />
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Main column: always leaves room for the collapsed width;
          when pinned, the padding grows to match the expanded width. */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col transition-[padding] duration-300 ease-out",
          pinned ? "lg:pl-64" : "lg:pl-[72px]",
        )}
      >
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

      {/* Mobile drawer (screens narrower than lg). */}
      <Modal open={drawerOpen} onClose={() => setDrawerOpen(false)} title={APP_NAME} side="left">
        <NavLinks expanded onNavigate={() => setDrawerOpen(false)} />
        <div className="mt-4">
          <UsageWidget plan={plan} usage={usage} />
        </div>
      </Modal>
    </div>
  );
}
