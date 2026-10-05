export const APP_NAME = "Lumen";

export const ROUTES = {
  dashboard: "/dashboard",
  newSummary: "/dashboard/new",
  archive: "/dashboard/summaries",
  billing: "/dashboard/billing",
  settings: "/dashboard/settings",
} as const;

export const summaryHref = (id: string) => `${ROUTES.archive}/${id}`;
