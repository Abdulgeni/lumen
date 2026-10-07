import { ArrowUp } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { env } from "@/env";
import {
  APP_NAME,
  AUTH_ROUTES,
  LEGAL_ROUTES,
  MARKETING_NAV,
  MARKETING_ROUTES,
  ROUTES,
} from "@/lib/routes";

const linkClass =
  "relative w-fit text-sm text-muted-foreground transition-colors duration-300 hover:text-gold-light " +
  "after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 " +
  "after:bg-gold/60 after:transition-transform after:duration-500 hover:after:scale-x-100 focus-visible:after:scale-x-100";

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <nav aria-label={title} className="space-y-5">
      <p className="text-[11px] font-semibold tracking-[0.22em] text-gold uppercase">{title}</p>
      <ul className="flex flex-col items-start gap-3.5">{children}</ul>
    </nav>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  const supportEmail = env.NEXT_PUBLIC_SUPPORT_EMAIL;

  return (
    <footer className="relative isolate mt-8 overflow-hidden bg-[radial-gradient(ellipse_at_50%_0%,rgba(200,169,106,0.07),transparent_65%)]">
      <div
        aria-hidden="true"
        className="h-px bg-linear-to-r from-transparent via-gold/50 to-transparent"
      />

      {/* Quiet decoration */}
      <LogoMark className="pointer-events-none absolute top-12 -right-6 -z-10 hidden h-104 w-auto opacity-[0.07] lg:block" />

      <div className="mx-auto grid max-w-7xl gap-14 px-6 pt-16 pb-12 sm:px-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <Link
            href={MARKETING_ROUTES.home}
            aria-label={`${APP_NAME} home`}
            className="inline-block"
          >
            <Logo />
          </Link>
          <p className="max-w-sm text-sm leading-relaxed font-light text-muted-foreground">
            Long reads, distilled. Clear summaries of articles, reports, and documents in the shape,
            tone, and language you choose.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href={AUTH_ROUTES.signUp} className={buttonVariants({ size: "sm" })}>
              Start free
            </Link>
            <a
              href={`mailto:${supportEmail}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Contact us
            </a>
          </div>
          <p className="max-w-sm text-xs leading-relaxed text-muted-foreground/80">
            AI-generated summaries can contain errors. Check important details against the original.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7 lg:pl-12">
          <Column title="Product">
            {MARKETING_NAV.map(({ label, href }) => (
              <li key={href}>
                <Link href={href} className={linkClass}>
                  {label}
                </Link>
              </li>
            ))}
          </Column>

          <Column title="Account">
            <li>
              <Link href={AUTH_ROUTES.signIn} className={linkClass}>
                Sign in
              </Link>
            </li>
            <li>
              <Link href={AUTH_ROUTES.signUp} className={linkClass}>
                Create account
              </Link>
            </li>
            <li>
              <Link href={ROUTES.dashboard} className={linkClass}>
                Dashboard
              </Link>
            </li>
          </Column>

          <Column title="Legal">
            <li>
              <Link href={LEGAL_ROUTES.privacy} className={linkClass}>
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href={LEGAL_ROUTES.terms} className={linkClass}>
                Terms of Service
              </Link>
            </li>
            <li>
              <a href="/.well-known/security.txt" className={linkClass}>
                Report a vulnerability
              </a>
            </li>
          </Column>
        </div>
      </div>

      {/* Oversized wordmark, fading into the page. Decorative only. */}
      <div aria-hidden="true" className="pointer-events-none overflow-hidden select-none">
        <p className="-mb-[0.16em] bg-linear-to-b from-gold/25 via-gold/10 to-transparent bg-clip-text text-center font-display text-[min(24vw,20rem)] leading-none font-light tracking-[0.12em] text-transparent uppercase">
          {APP_NAME}
        </p>
      </div>

      <div className="border-t border-border/70">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:px-8">
          <p>
            © {year} {APP_NAME}. All rights reserved.
          </p>
          <a
            href="#main"
            className="group inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 transition-colors hover:border-gold/40 hover:text-gold-light"
          >
            Back to top
            <ArrowUp className="size-3 transition-transform duration-300 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
