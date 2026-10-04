import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleButton } from "@/components/auth/google-button";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { safeNext } from "@/lib/safe-redirect";
import { getSession } from "@/server/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string; error?: string }>;
}) {
  const { next: rawNext, reset, error } = await searchParams;
  const next = safeNext(rawNext);
  if (await getSession()) redirect(next);

  return (
    <Card className="gold-gradient-border">
      <CardHeader>
        <h1 className="font-display text-3xl font-light">Welcome back</h1>
        <CardDescription>Sign in to continue to Lumen.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {reset ? (
          <p role="status" className="text-sm text-primary">
            Password updated. Sign in with your new password.
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-red-400">
            We could not sign you in with Google. Please try again.
          </p>
        ) : null}
        <GoogleButton next={next} />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <SignInForm next={next} />
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        New to Lumen?&nbsp;
        <Link href="/sign-up" className="text-primary hover:underline">
          Create an account
        </Link>
      </CardFooter>
    </Card>
  );
}
