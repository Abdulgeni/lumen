import { Check } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { isPaidPlan, PLAN_PRICE_USD } from "@/lib/billing";
import { getPlan, PLAN_IDS, planFeatures } from "@/lib/plans";
import { AUTH_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

/** Prices and features come from the same config that enforces limits, so the page cannot drift. */
export function PricingCards() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {PLAN_IDS.map((id, index) => {
        const plan = getPlan(id);
        const price = isPaidPlan(id) ? PLAN_PRICE_USD[id] : 0;
        const featured = id === "pro";
        return (
          <Reveal key={id} delay={index * 120}>
            <article
              className={cn(
                "flex h-full flex-col justify-between rounded-3xl border bg-card/70 p-8 backdrop-blur-xl",
                featured
                  ? "gold-gradient-border border-gold/40 shadow-[0_0_45px_-10px_rgba(200,169,106,0.22)]"
                  : "border-border",
              )}
            >
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-2xl font-semibold">{plan.name}</h2>
                  {featured ? (
                    <span className="rounded-full border border-gold/40 bg-gold/15 px-2.5 py-0.5 text-[11px] font-medium text-gold-light">
                      Most popular
                    </span>
                  ) : null}
                </div>
                <p className="mb-6">
                  <span className="font-display text-5xl font-semibold">
                    {price === 0 ? "Free" : `$${price}`}
                  </span>
                  {price > 0 ? (
                    <span className="text-sm text-muted-foreground"> / month</span>
                  ) : null}
                </p>
                <ul className="mb-8 space-y-3">
                  {planFeatures(plan).map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-gold" /> {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href={AUTH_ROUTES.signUp}
                className={buttonVariants({
                  variant: featured ? "default" : "outline",
                  className: "w-full",
                })}
              >
                {price === 0 ? "Start free" : `Get ${plan.name}`}
              </Link>
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}
