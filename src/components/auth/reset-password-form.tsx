"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { z } from "zod";
import { Field } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { resetPasswordSchema } from "@/lib/validation/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);
    const parsed = resetPasswordSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setFieldErrors({});
    setPending(true);

    const { error } = await authClient.resetPassword({ newPassword: parsed.data.password, token });
    if (error) {
      setPending(false);
      setFormError(error.message ?? "This link is invalid or has expired.");
      return;
    }
    router.replace("/sign-in?reset=1");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field
        id="password"
        name="password"
        type="password"
        label="New password"
        autoComplete="new-password"
        error={fieldErrors.password?.[0]}
      />
      {formError ? (
        <p role="alert" className="text-sm text-red-400">
          {formError}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}
