import type { ReactNode } from "react";
import { env } from "@/env";
import { LEGAL } from "@/lib/legal";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-6 pt-20 pb-24 sm:px-8">
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">Effective: {LEGAL.effectiveDate}</p>
      <div className="mt-10 space-y-10">{children}</div>
    </article>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground [&_li]:pl-1 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

export function SupportLink() {
  return (
    <a
      href={`mailto:${env.NEXT_PUBLIC_SUPPORT_EMAIL}`}
      className="text-gold underline underline-offset-2 hover:text-gold-light"
    >
      {env.NEXT_PUBLIC_SUPPORT_EMAIL}
    </a>
  );
}
