import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleButton } from "@/components/auth/google-button";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { getSession } from "@/server/session";

export const metadata: Metadata = { title: "Create account" };

export default async function SignUpPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <Card className="gold-gradient-border">
      <CardHeader>
        <h1 className="font-display text-3xl font-light">Create your account</h1>
        <CardDescription>Start summarizing in under a minute.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <GoogleButton next="/dashboard" />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <SignUpForm />
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Already have an account?&nbsp;
        <Link href="/sign-in" className="text-primary hover:underline">
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
