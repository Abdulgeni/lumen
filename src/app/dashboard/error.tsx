"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-24 text-center">
      <h1 className="font-display text-3xl font-light">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        We could not load this page. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
