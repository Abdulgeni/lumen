"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { AUTH_ROUTES, ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function AuthButtons({
  stacked = false,
  onNavigate,
}: {
  stacked?: boolean;
  onNavigate?: () => void;
}) {
  const { data: session } = authClient.useSession();
  const layout = cn("flex gap-2", stacked && "flex-col");

  if (session) {
    return (
      <div className={layout}>
        <Link
          href={ROUTES.dashboard}
          onClick={onNavigate}
          className={buttonVariants({ size: "sm" })}
        >
          Open dashboard
        </Link>
      </div>
    );
  }
  return (
    <div className={layout}>
      <Link
        href={AUTH_ROUTES.signIn}
        onClick={onNavigate}
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        Sign in
      </Link>
      <Link
        href={AUTH_ROUTES.signUp}
        onClick={onNavigate}
        className={buttonVariants({ size: "sm" })}
      >
        Get started
      </Link>
    </div>
  );
}
