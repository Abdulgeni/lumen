"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** After returning from Checkout, re-check briefly in case the plan update is still arriving. */
export function RefreshWhilePending({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    let runs = 0;
    const timer = setInterval(() => {
      runs += 1;
      router.refresh();
      if (runs >= 6) clearInterval(timer);
    }, 2000);
    return () => clearInterval(timer);
  }, [active, router]);
  return null;
}
