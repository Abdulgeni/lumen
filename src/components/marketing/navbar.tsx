"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Modal } from "@/components/ui/modal";
import { APP_NAME, MARKETING_NAV, MARKETING_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { AuthButtons } from "./auth-buttons";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
        <Link href={MARKETING_ROUTES.home} aria-label={`${APP_NAME} home`}>
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {MARKETING_NAV.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm transition-colors",
                pathname === href
                  ? "text-gold-light"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <AuthButtons />
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
        >
          <Menu className="size-5" />
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={APP_NAME} side="left">
        <nav aria-label="Mobile" className="space-y-1">
          {MARKETING_NAV.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={pathname === href ? "page" : undefined}
              className={cn(
                "block rounded-xl px-4 py-3 text-sm transition-colors",
                pathname === href
                  ? "bg-secondary text-gold-light"
                  : "text-muted-foreground hover:bg-secondary/60",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-6">
          <AuthButtons stacked onNavigate={() => setOpen(false)} />
        </div>
      </Modal>
    </header>
  );
}
