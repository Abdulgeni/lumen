import type { Metadata } from "next";
import { CtaBand } from "@/components/marketing/cta-band";
import { ModeStack } from "@/components/marketing/mode-stack";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "Showcase",
  description:
    "See the same source summarized as an Executive Brief, as Key Points, and as a Deep Dive.",
  alternates: { canonical: "/showcase" },
};

export default function ShowcasePage() {
  return (
    <>
      <PageHero eyebrow="Showcase" title="One source," accent="three shapes.">
        The same short report, summarized in each of Lumen&rsquo;s modes.
      </PageHero>
      <section className="px-6 pb-12 sm:px-8">
        <Reveal>
          <ModeStack />
        </Reveal>
      </section>
      <CtaBand />
    </>
  );
}
