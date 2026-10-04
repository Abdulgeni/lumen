"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { z } from "zod";
import { Field } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { signInSchema } from "@/lib/validation/auth";

export function SignInForm({ next }: { next: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);
    const parsed = signInSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setFieldErrors({});
    setPending(true);

    const { error } = await authClient.signIn.email({ ...parsed.data, callbackURL: next });
    if (error) {
      setPending(false);
      setFormError(
        error.status === 403
          ? "Please verify your email first. We just sent you a new link."
          : (error.message ?? "Unable to sign in. Please try again."),
      );
      return;
    }
    router.replace(next);
    router.refresh();
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
      <Field
        id="password"
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        error={fieldErrors.password?.[0]}
        labelAside={
          <Link href="/forgot-password" className="text-xs text-primary hover:underline">
            Forgot password?
          </Link>
        }
      />
      {formError ? (
        <p role="alert" className="text-sm text-red-400">
          {formError}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
