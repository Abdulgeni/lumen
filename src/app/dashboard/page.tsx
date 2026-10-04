import type { Metadata } from "next";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default async function DashboardPage() {
  const { user } = await requireSession();

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-5 px-6">
      <p className="text-sm text-muted-foreground">Signed in as</p>
      <h1 className="font-display text-5xl font-light">{user.name}</h1>
      <p className="text-muted-foreground">{user.email}</p>
      <div>
        <SignOutButton />
      </div>
    </main>
  );
}
