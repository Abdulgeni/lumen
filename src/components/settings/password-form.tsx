"use client";

import { type FormEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Field } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { changePasswordSchema } from "@/lib/validation/auth";

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);
    const parsed = changePasswordSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!parsed.success) return void setFieldErrors(z.flattenError(parsed.error).fieldErrors);
    setFieldErrors({});

    setPending(true);
    const { error } = await authClient.changePassword({
      ...parsed.data,
      revokeOtherSessions: true,
    });
    setPending(false);
    if (error) return void setFormError(error.message ?? "Could not change your password.");
    formRef.current?.reset();
    toast.success("Password updated. Your other devices were signed out.");
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-4">
      <Field
        id="currentPassword"
        name="currentPassword"
        type="password"
        label="Current password"
        autoComplete="current-password"
        error={fieldErrors.currentPassword?.[0]}
      />
      <Field
        id="newPassword"
        name="newPassword"
        type="password"
        label="New password"
        autoComplete="new-password"
        error={fieldErrors.newPassword?.[0]}
      />
      {formError ? (
        <p role="alert" className="text-sm text-red-400">
          {formError}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Updating…" : "Change password"}
      </Button>
    </form>
  );
}
