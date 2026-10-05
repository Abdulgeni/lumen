"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Action = "pro" | "team" | "portal";

export function BillingActions({ isPaid }: { isPaid: boolean }) {
  const [pending, setPending] = useState<Action>();
  const [error, setError] = useState<string>();

  async function go(action: Action) {
    setPending(action);
    setError(undefined);
    const response =
      action === "portal"
        ? await fetch("/api/billing/portal", { method: "POST" })
        : await fetch("/api/billing/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan: action }),
          });
    const data = (await response.json().catch(() => null)) as {
      url?: string;
      error?: { message?: string };
    } | null;
    if (!response.ok || !data?.url) {
      setPending(undefined);
      setError(data?.error?.message ?? "Something went wrong. Please try again.");
      return;
    }
    window.location.assign(data.url);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {isPaid ? (
          <Button onClick={() => go("portal")} disabled={pending !== undefined}>
            {pending === "portal" ? "Opening…" : "Manage billing"}
          </Button>
        ) : (
          <>
            <Button onClick={() => go("pro")} disabled={pending !== undefined}>
              {pending === "pro" ? "Redirecting…" : "Upgrade to Pro"}
            </Button>
            <Button variant="outline" onClick={() => go("team")} disabled={pending !== undefined}>
              {pending === "team" ? "Redirecting…" : "Upgrade to Team"}
            </Button>
          </>
        )}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
