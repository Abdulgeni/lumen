export const APP_NAME = "Lumen";

export const ROUTES = {
  dashboard: "/dashboard",
  newSummary: "/dashboard/new",
  archive: "/dashboard/summaries",
  billing: "/dashboard/billing",
  settings: "/dashboard/settings",
} as const;

export const summaryHref = (id: string) => `${ROUTES.archive}/${id}`;

export const MARKETING_ROUTES = {
  home: "/",
  features: "/features",
  howItWorks: "/how-it-works",
  showcase: "/showcase",
  pricing: "/pricing",
  faq: "/faq",
} as const;

export const AUTH_ROUTES = { signIn: "/sign-in", signUp: "/sign-up" } as const;

export const MARKETING_NAV = [
  { label: "Features", href: MARKETING_ROUTES.features },
  { label: "How it works", href: MARKETING_ROUTES.howItWorks },
  { label: "Showcase", href: MARKETING_ROUTES.showcase },
  { label: "Pricing", href: MARKETING_ROUTES.pricing },
  { label: "FAQ", href: MARKETING_ROUTES.faq },
] as const;
