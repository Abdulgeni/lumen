"use client";

import { type FormEvent, useState } from "react";
import { z } from "zod";
import { Field } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { forgotPasswordSchema } from "@/lib/validation/auth";

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = forgotPasswordSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setFieldErrors({});
    setPending(true);
    await authClient.requestPasswordReset({
      email: parsed.data.email,
      redirectTo: "/reset-password",
    });
    // Same message whether or not the account exists.
    setDone(true);
  }

  if (done) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        If an account exists for that email, we have sent a reset link. It expires in one hour.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        error={fieldErrors.email?.[0]}
      />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
