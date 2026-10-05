import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/page-hero";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { MARKETING_ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start free. Upgrade to Pro or Team for more summaries, longer documents, file uploads, and Deep Dive.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <>
      <PageHero eyebrow="Pricing" title="Start free." accent="Upgrade when it helps.">
        Every plan includes the same summaries. Paid plans add volume, longer documents, file
        uploads, and Deep Dive.
      </PageHero>
      <section className="mx-auto max-w-6xl px-6 pb-12 sm:px-8">
        <PricingCards />
        <p className="mt-10 text-center text-xs leading-relaxed text-muted-foreground">
          Prices are in US dollars, billed monthly through Stripe. You can cancel at any time and
          keep your plan until the end of the billing period. See the{" "}
          <Link
            href={MARKETING_ROUTES.faq}
            className="text-gold underline underline-offset-2 hover:text-gold-light"
          >
            FAQ
          </Link>{" "}
          for more.
        </p>
      </section>
    </>
  );
}