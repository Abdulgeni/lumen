"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function ResendVerification({ email }: { email: string }) {
  const [cooldown, setCooldown] = useState(0);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function onClick() {
    setPending(true);
    await authClient.sendVerificationEmail({ email, callbackURL: "/dashboard" });
    setPending(false);
    setCooldown(60);
  }

  return (
    <Button variant="outline" onClick={onClick} disabled={pending || cooldown > 0}>
      {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend email"}
    </Button>
  );
}
