import { Archive, Layers, Link2, ShieldCheck, SlidersHorizontal, Zap } from "lucide-react";
import type { Metadata } from "next";
import { CtaBand } from "@/components/marketing/cta-band";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/marketing/reveal";
import { LENGTH_LABELS, MODE_LABELS, OUTPUT_LANGUAGES, SUMMARY_TONES } from "@/lib/summary-options";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Three summary modes, any source, full control over length, tone, and language, and a searchable archive.",
  alternates: { canonical: "/features" },
};

const FEATURES = [
  {
    icon: Layers,
    title: "Three ways to read",
    body: "Executive Brief for decisions, Key Points for scanning, and Deep Dive for structured analysis on paid plans.",
  },
  {
    icon: Link2,
    title: "Bring any source",
    body: "Paste text, add a public web link, or upload PDF, DOCX, TXT and Markdown files on paid plans.",
  },
  {
    icon: SlidersHorizontal,
    title: "Shape every summary",
    body: `Choose from ${Object.keys(LENGTH_LABELS).length} lengths, ${SUMMARY_TONES.length} tones, and ${OUTPUT_LANGUAGES.length} output languages.`,
  },
  {
    icon: Archive,
    title: "A searchable archive",
    body: "Every summary is saved. Search, filter by mode, mark favorites, rename, and export as Markdown.",
  },
  {
    icon: Zap,
    title: "Watch it being written",
    body: "Summaries stream in as they are generated, and you can cancel at any moment. Cancelled or failed runs never use your quota.",
  },
  {
    icon: ShieldCheck,
    title: "Built to stay grounded",
    body: "Lumen instructs the model to use only what is in your source. As with any AI, check important details against the original.",
  },
] as const;

const MODES = [
  {
    mode: "EXECUTIVE_BRIEF",
    best: "Decisions and updates",
    shape: "Bottom line, key facts, implications",
  },
  {
    mode: "KEY_POINTS",
    best: "Scanning and notes",
    shape: "Ordered bullets with bold lead phrases",
  },
  {
    mode: "DEEP_DIVE",
    best: "Research and review",
    shape: "Overview, themes, evidence, caveats, takeaways",
  },
] as const;

export default function FeaturesPage() {
  return (
    <>
      <PageHero eyebrow="Features" title="Everything you need to" accent="read less.">
        A focused set of tools, built around one job: turning long material into something you can
        use.
      </PageHero>

      <section className="mx-auto max-w-6xl px-6 pb-20 sm:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }, index) => (
            <Reveal key={title} delay={(index % 3) * 100}>
              <article className="group h-full rounded-3xl border border-border bg-card/70 p-8 backdrop-blur-xl transition-colors hover:border-gold/40">
                <span className="mb-5 flex size-11 items-center justify-center rounded-xl border border-gold/30 bg-secondary text-gold">
                  <Icon className="size-5" />
                </span>
                <h2 className="mb-2 font-display text-2xl font-semibold transition-colors group-hover:text-gold-light">
                  {title}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section aria-labelledby="modes" className="mx-auto max-w-5xl px-6 pb-8 sm:px-8">
        <Reveal>
          <h2
            id="modes"
            className="mb-8 text-center font-display text-3xl font-semibold sm:text-4xl"
          >
            Pick the shape that fits
          </h2>
          <div className="overflow-hidden rounded-3xl border border-border bg-card/70 backdrop-blur-xl">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs tracking-wider text-gold uppercase">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Mode
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Best for
                  </th>
                  <th scope="col" className="hidden px-6 py-4 font-semibold sm:table-cell">
                    Shape
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MODES.map(({ mode, best, shape }) => (
                  <tr key={mode}>
                    <th scope="row" className="px-6 py-4 font-medium">
                      {MODE_LABELS[mode]}
                    </th>
                    <td className="px-6 py-4 text-muted-foreground">{best}</td>
                    <td className="hidden px-6 py-4 text-muted-foreground sm:table-cell">
                      {shape}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      <CtaBand />
    </>
  );
}
