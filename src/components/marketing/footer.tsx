import Link from "next/link";
import { APP_NAME, AUTH_ROUTES, MARKETING_NAV, MARKETING_ROUTES } from "@/lib/routes";

export function Footer() {
  const year = new Date().getFullYear();
  const link = "text-sm text-muted-foreground transition-colors hover:text-gold-light";

  return (
    <footer className="relative border-t border-border bg-background/60 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:px-8 md:grid-cols-4">
        <div className="space-y-3 md:col-span-2">
          <Link
            href={MARKETING_ROUTES.home}
            className="gold-shimmer font-display text-2xl font-medium tracking-[0.3em] uppercase"
          >
            {APP_NAME}
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Long reads, distilled. Clear summaries of articles, reports, and documents in the shape,
            tone, and language you choose.
          </p>
        </div>
        <nav aria-label="Product" className="space-y-3">
          <p className="text-xs font-semibold tracking-wider text-gold uppercase">Product</p>
          <ul className="space-y-2">
            {MARKETING_NAV.map(({ label, href }) => (
              <li key={href}>
                <Link href={href} className={link}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Account" className="space-y-3">
          <p className="text-xs font-semibold tracking-wider text-gold uppercase">Account</p>
          <ul className="space-y-2">
            <li>
              <Link href={AUTH_ROUTES.signIn} className={link}>
                Sign in
              </Link>
            </li>
            <li>
              <Link href={AUTH_ROUTES.signUp} className={link}>
                Create account
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-border px-6 py-5 text-center text-xs text-muted-foreground">
        © {year} {APP_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
