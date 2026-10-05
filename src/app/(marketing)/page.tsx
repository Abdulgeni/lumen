import { ArrowRight, Archive, Compass, Layers, Link2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/marketing/cta-band";
import { Reveal } from "@/components/marketing/reveal";
import { HeroCanvas } from "@/components/three/hero-canvas";
import { buttonVariants } from "@/components/ui/button";
import { getPlan } from "@/lib/plans";
import { AUTH_ROUTES, MARKETING_NAV, MARKETING_ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: { absolute: "Lumen: Every long read, distilled" },
  description:
    "Turn articles, reports, and documents into clear briefs in seconds. Paste text, add a link, or upload a file, then choose the shape, tone, and language.",
  alternates: { canonical: "/" },
};

const PILLARS = [
  {
    icon: Layers,
    title: "Three ways to read",
    body: "An Executive Brief for decisions, Key Points for scanning, and a structured Deep Dive when you need the detail.",
  },
  {
    icon: Link2,
    title: "Bring any source",
    body: "Paste text, add a public web link, or upload a PDF, Word, text, or Markdown file.",
  },
  {
    icon: Archive,
    title: "Yours to keep",
    body: "Every summary is saved to a searchable archive you can filter, rename, and export.",
  },
] as const;

const DESCRIPTIONS: Record<string, string> = {
  "/features": "What Lumen does, in detail.",
  "/how-it-works": "From source to summary in three steps.",
  "/showcase": "See the three modes side by side.",
  "/pricing": "Free to start. Upgrade when you need more.",
  "/faq": "Quick answers about limits, files, and privacy.",
};

export default function HomePage() {
  const free = getPlan("free");

  return (
    <>
      <section className="relative isolate flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
        <HeroCanvas />

        <div className="mx-auto flex max-w-4xl flex-col items-center">
          <p className="mb-6 rounded-full border border-gold/30 bg-secondary/70 px-4 py-1.5 text-[11px] font-medium tracking-widest text-gold-light uppercase backdrop-blur-md">
            Executive-grade summaries
          </p>
          <h1 className="font-display text-5xl leading-[1.05] font-semibold tracking-tight sm:text-7xl lg:text-[5.5rem]">
            Every long read, <span className="gold-shimmer font-normal italic">distilled</span> to
            what matters.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed font-light text-muted-foreground sm:text-lg">
            Turn articles, reports, and documents into clear briefs in seconds. Paste text, add a
            link, or upload a file, then choose the shape, tone, and language.
          </p>

          <div className="mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            <Link
              href={AUTH_ROUTES.signUp}
              className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}
            >
              Start summarizing free <ArrowRight className="size-4" />
            </Link>
            <Link
              href={MARKETING_ROUTES.howItWorks}
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "w-full sm:w-auto",
              })}
            >
              How it works
            </Link>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            {free.monthlySummaries} free summaries every month · No card required
          </p>
        </div>
      </section>

      <section aria-labelledby="pillars" className="mx-auto max-w-6xl px-6 py-24 sm:px-8">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <h2
            id="pillars"
            className="font-display text-3xl font-semibold tracking-tight sm:text-5xl"
          >
            Less to read. <span className="gold-shimmer font-normal italic">Nothing</span> lost that
            matters.
          </h2>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }, index) => (
            <Reveal key={title} delay={index * 120}>
              <div className="h-full rounded-3xl border border-border bg-card/70 p-8 backdrop-blur-xl">
                <span className="mb-5 flex size-11 items-center justify-center rounded-xl border border-gold/30 bg-secondary text-gold">
                  <Icon className="size-5" />
                </span>
                <h3 className="mb-2 font-display text-2xl font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section aria-labelledby="explore" className="mx-auto max-w-6xl px-6 pb-8 sm:px-8">
        <Reveal>
          <h2
            id="explore"
            className="mb-6 flex items-center gap-2 text-xs font-semibold tracking-widest text-gold uppercase"
          >
            <Compass className="size-4" /> Explore
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {MARKETING_NAV.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-2xl border border-border bg-card/60 p-5 transition-colors hover:border-gold/40"
              >
                <span className="flex items-center justify-between font-medium">
                  {label}
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-gold" />
                </span>
                <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                  {DESCRIPTIONS[href]}
                </span>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      <CtaBand />
    </>
  );
}
