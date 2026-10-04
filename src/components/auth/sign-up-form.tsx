"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { z } from "zod";
import { Field } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { signUpSchema } from "@/lib/validation/auth";

export function SignUpForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);
    const parsed = signUpSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setFieldErrors({});
    setPending(true);

    const { error } = await authClient.signUp.email({ ...parsed.data, callbackURL: "/dashboard" });
    if (error) {
      setPending(false);
      setFormError(error.message ?? "Unable to create your account. Please try again.");
      return;
    }
    router.push(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field
        id="name"
        name="name"
        label="Full name"
        autoComplete="name"
        error={fieldErrors.name?.[0]}
      />
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
        autoComplete="new-password"
        error={fieldErrors.password?.[0]}
      />
      <p className="text-xs text-muted-foreground">At least 10 characters.</p>
      {formError ? (
        <p role="alert" className="text-sm text-red-400">
          {formError}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
