"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { authClient } from "@/lib/auth-client";

export function DeleteAccount({ hasSubscription }: { hasSubscription: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();

  function close() {
    setOpen(false);
    setConfirm("");
    setError(undefined);
  }

  async function submit() {
    setPending(true);
    setError(undefined);
    const { error: apiError } = await authClient.deleteUser({ callbackURL: "/" });
    setPending(false);
    if (apiError) {
      return void setError(
        apiError.message ??
          "We could not start the deletion. If you signed in a while ago, sign in again and retry.",
      );
    }
    setSent(true);
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete account
      </Button>
      <Modal
        open={open}
        onClose={close}
        title={sent ? "Check your email" : "Delete your account?"}
        description={
          sent
            ? "We sent you a confirmation link. Your account is deleted only after you open it."
            : "This permanently deletes your account and every saved summary. It cannot be undone."
        }
      >
        {sent ? (
          <div className="flex justify-end">
            <Button onClick={close}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {hasSubscription ? (
              <p role="note" className="text-sm text-gold-light">
                Your subscription is cancelled immediately when the account is deleted, and the
                current period is not refunded.
              </p>
            ) : null}
            <div className="space-y-2">
              <label htmlFor="delete-confirm" className="text-sm text-muted-foreground">
                Type <span className="font-semibold text-foreground">DELETE</span> to continue
              </label>
              <Input
                id="delete-confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="off"
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-red-400">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={submit}
                disabled={confirm !== "DELETE" || pending}
              >
                {pending ? "Sending…" : "Email me the confirmation link"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
