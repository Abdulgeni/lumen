import { BookOpen, FileUp, SlidersHorizontal } from "lucide-react";
import type { Metadata } from "next";
import { CtaBand } from "@/components/marketing/cta-band";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Add a source, choose the shape of your summary, then read it, save it, and export it.",
  alternates: { canonical: "/how-it-works" },
};

const STEPS = [
  {
    icon: FileUp,
    title: "Add your source",
    body: "Paste text, add a public web link, or upload a PDF, DOCX, TXT or Markdown file. Lumen reads the page or document and leaves out navigation and clutter.",
  },
  {
    icon: SlidersHorizontal,
    title: "Choose the shape",
    body: "Pick a mode, a length, a tone, and the language you want the summary written in. Your defaults are remembered.",
  },
  {
    icon: BookOpen,
    title: "Read, save, export",
    body: "Your summary streams in as it is written, then lands in your archive, where you can search it, favorite it, rename it, or download it as Markdown.",
  },
] as const;

const DATA_POINTS = [
  "Your text and files are sent to Google's Gemini API to generate the summary.",
  "We save your summary and a short excerpt of the source. We do not keep your full original text.",
  "Links are fetched with safety checks, and only public web pages can be read.",
  "You can delete any summary, or your whole account, at any time.",
] as const;

export default function HowItWorksPage() {
  return (
    <>
      <PageHero eyebrow="How it works" title="From source to summary in" accent="three steps.">
        No setup, no prompts to write. Add something to read and choose how you want it.
      </PageHero>

      <section className="mx-auto max-w-6xl px-6 pb-20 sm:px-8">
        <ol className="grid gap-6 md:grid-cols-3" role="list">
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <Reveal key={title} delay={index * 120}>
              <li
                role="listitem"
                className="relative h-full list-none rounded-3xl border border-border bg-card/70 p-8 backdrop-blur-xl"
              >
                <span className="font-display absolute top-6 right-7 text-5xl text-gold/20">
                  {index + 1}
                </span>
                <span className="mb-5 flex size-11 items-center justify-center rounded-xl border border-gold/30 bg-secondary text-gold">
                  <Icon className="size-5" />
                </span>
                <h2 className="font-display mb-2 text-2xl font-semibold">{title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <section aria-labelledby="data" className="mx-auto max-w-3xl px-6 pb-8 sm:px-8">
        <Reveal className="gold-gradient-border rounded-3xl bg-card/60 p-8 backdrop-blur-xl sm:p-10">
          <h2 id="data" className="font-display mb-5 text-2xl font-semibold sm:text-3xl">
            What happens to your data
          </h2>
          <ul className="space-y-3">
            {DATA_POINTS.map((point) => (
              <li key={point} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <CtaBand />
    </>
  );
}