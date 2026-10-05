"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api-client";
import type { PaidPlanId } from "@/lib/billing";

type Variant = "default" | "outline";

function useRedirect() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function go(path: string, body?: object) {
    setPending(true);
    setError(undefined);
    const result = await apiRequest<{ url: string }>(path, {
      method: "POST",
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!result.ok) {
      setPending(false);
      setError(result.message);
      return;
    }
    window.location.assign(result.data.url);
  }
  return { pending, error, go };
}

export function CheckoutButton({
  plan,
  variant = "default",
  children,
}: {
  plan: PaidPlanId;
  variant?: Variant;
  children: ReactNode;
}) {
  const { pending, error, go } = useRedirect();
  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        variant={variant}
        disabled={pending}
        onClick={() => go("/api/billing/checkout", { plan })}
      >
        {pending ? "Redirecting…" : children}
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function PortalButton({ children }: { children: ReactNode }) {
  const { pending, error, go } = useRedirect();
  return (
    <div className="space-y-2">
      <Button disabled={pending} onClick={() => go("/api/billing/portal")}>
        {pending ? "Opening…" : children}
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
