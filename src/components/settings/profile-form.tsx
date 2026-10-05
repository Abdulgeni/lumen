"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { profileSchema } from "@/lib/validation/auth";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    const parsed = profileSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) return void setError(parsed.error.issues[0]?.message);

    setPending(true);
    const { error: apiError } = await authClient.updateUser({ name: parsed.data.name });
    setPending(false);
    if (apiError) return void setError(apiError.message ?? "Could not update your name.");
    toast.success("Profile updated.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Field
        id="name"
        name="name"
        label="Full name"
        defaultValue={name}
        autoComplete="name"
        error={error}
      />
      <Field id="email" label="Email" value={email} readOnly disabled />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
