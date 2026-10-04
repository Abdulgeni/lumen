import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  const invalid = !token || Boolean(error);

  return (
    <Card className="gold-gradient-border">
      <CardHeader>
        <h1 className="font-display text-3xl font-light">Choose a new password</h1>
        <CardDescription>
          {invalid ? "This reset link is invalid or has expired." : "Use at least 10 characters."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invalid ? (
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            Request a new link
          </Link>
        ) : (
          <ResetPasswordForm token={token} />
        )}
      </CardContent>
    </Card>
  );
}
