import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getPlan } from "@/lib/plans";
import { AUTH_ROUTES } from "@/lib/routes";
import { Reveal } from "./reveal";

export function CtaBand({ title = "Your next long read, distilled." }: { title?: string }) {
  const free = getPlan("free");
  return (
    <section className="px-6 py-24 sm:px-8">
      <Reveal className="gold-gradient-border mx-auto max-w-4xl rounded-3xl bg-card/60 px-8 py-14 text-center backdrop-blur-xl">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Start free with {free.monthlySummaries} summaries every month. No card required.
        </p>
        <Link
          href={AUTH_ROUTES.signUp}
          className={buttonVariants({ size: "lg", className: "mt-8" })}
        >
          Start summarizing free
        </Link>
      </Reveal>
    </section>
  );
}
