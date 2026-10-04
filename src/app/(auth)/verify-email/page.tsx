import type { Metadata } from "next";
import Link from "next/link";
import { ResendVerification } from "@/components/auth/resend-verification";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Check your inbox" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <Card className="gold-gradient-border">
      <CardHeader>
        <h1 className="font-display text-3xl font-light">Check your inbox</h1>
        <CardDescription>
          {email
            ? `We sent a confirmation link to ${email}. Open it to finish creating your account.`
            : "We sent you a confirmation link. Open it to finish creating your account."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {email ? <ResendVerification email={email} /> : null}
        <p className="text-sm text-muted-foreground">
          Wrong address?&nbsp;
          <Link href="/sign-up" className="text-primary hover:underline">
            Start again
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
