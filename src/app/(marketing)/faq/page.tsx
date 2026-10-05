import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import { CtaBand } from "@/components/marketing/cta-band";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/marketing/reveal";
import { getPlan } from "@/lib/plans";
import { OUTPUT_LANGUAGES } from "@/lib/summary-options";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about limits, supported files, languages, accuracy, and how your data is handled.",
  alternates: { canonical: "/faq" },
};

const free = getPlan("free");
const pro = getPlan("pro");

const FAQS = [
  {
    q: "What can I summarize?",
    a: `Pasted text, public web links, and (on paid plans) PDF, DOCX, TXT and Markdown files up to ${Math.floor(pro.maxFileBytes / 1024 / 1024)} MB. Free accounts can summarize up to ${free.maxInputWords.toLocaleString("en-US")} words at a time.`,
  },
  {
    q: "How accurate are the summaries?",
    a: "Lumen instructs the model to use only what is in your source and not to invent facts. AI can still make mistakes, so check important details against the original before relying on them.",
  },
  {
    q: "Is my content private?",
    a: "Your text and files are sent to Google's Gemini API to generate the summary. We save the summary and a short excerpt of the source, not your full original text, and you can delete any summary or your whole account whenever you like.",
  },
  {
    q: "Which languages are supported?",
    a: `You can choose from ${OUTPUT_LANGUAGES.length} output languages, regardless of the language of your source.`,
  },
  {
    q: "What happens when I reach my monthly limit?",
    a: `The Free plan includes ${free.monthlySummaries} summaries a month. Cancelled or failed summaries do not count. When you reach the limit you can upgrade, or wait for your quota to reset.`,
  },
  {
    q: "Why can't Lumen read a particular link?",
    a: "Pages that require you to sign in, block automated access, or load their text with JavaScript cannot be read. Paste the text instead.",
  },
  {
    q: "Can I cancel any time?",
    a: "Yes. Manage or cancel your subscription from your billing page. You keep your plan until the end of the period you have paid for.",
  },
] as const;

export default function FaqPage() {
  return (
    <>
      <PageHero eyebrow="FAQ" title="Questions," accent="answered." />
      <section className="mx-auto max-w-3xl space-y-3 px-6 pb-8 sm:px-8">
        {FAQS.map(({ q, a }, index) => (
          <Reveal key={q} delay={Math.min(index, 4) * 60}>
            <details className="group rounded-2xl border border-border bg-card/70 px-6 py-5 backdrop-blur-xl open:border-gold/30">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDown className="size-4 shrink-0 text-gold transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </details>
          </Reveal>
        ))}
      </section>
      <CtaBand />
    </>
  );
}
