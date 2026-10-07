import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/brand/logo";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(200,169,106,0.12),transparent_60%)]"
      />
      <Link
        href="/"
        aria-label="Lumen home"
        className="relative mb-10 flex flex-col items-center gap-4"
      >
        <LogoMark className="h-16 w-auto drop-shadow-[0_0_14px_rgba(200,169,106,0.35)]" />
        <span className="gold-shimmer font-display text-3xl font-light tracking-[0.35em] uppercase">
          Lumen
        </span>
      </Link>
      <div className="relative w-full max-w-md">{children}</div>
    </main>
  );
}
