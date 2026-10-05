"use client";

import { CreditCard, FileText, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";

type Props = { name: string; email: string; planName: string };

export function UserMenu({ name, email, planName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    await authClient.signOut();
    router.replace("/");
    router.refresh();
  }

  const item =
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-full p-1 transition-colors hover:bg-secondary"
      >
        <span className="flex size-8 items-center justify-center rounded-full border border-gold/40 bg-secondary text-xs font-semibold text-gold-light">
          {name.slice(0, 2).toUpperCase()}
        </span>
        <span className="hidden flex-col text-left md:flex">
          <span className="text-xs leading-none font-semibold">{name}</span>
          <span className="mt-0.5 text-[10px] font-medium text-primary">{planName} plan</span>
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-60 rounded-2xl border border-border bg-popover p-2 shadow-2xl"
        >
          <div className="border-b border-border px-3 pt-1 pb-3">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <div className="space-y-0.5 pt-2" onClick={() => setOpen(false)}>
            <Link role="menuitem" href={ROUTES.archive} className={item}>
              <FileText className="size-4 text-gold" /> Archive
            </Link>
            <Link role="menuitem" href={ROUTES.billing} className={item}>
              <CreditCard className="size-4 text-gold-light" /> Plan &amp; Billing
            </Link>
            <Link role="menuitem" href={ROUTES.settings} className={item}>
              <Settings className="size-4" /> Settings
            </Link>
          </div>
          <div className="mt-1 border-t border-border pt-1">
            <button type="button" role="menuitem" onClick={signOut} className={item}>
              <LogOut className="size-4" /> Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
