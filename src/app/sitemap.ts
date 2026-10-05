import type { MetadataRoute } from "next";
import { env } from "@/env";
import { LEGAL_ROUTES, MARKETING_ROUTES } from "@/lib/routes";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries = [
    ...Object.values(MARKETING_ROUTES).map((path) => ({
      path: path as string,
      priority: path === "/" ? 1 : 0.7,
    })),
    ...Object.values(LEGAL_ROUTES).map((path) => ({
      path: path as string,
      priority: 0.3,
    })),
  ];
  return entries.map(({ path, priority }) => ({
    url: `${env.NEXT_PUBLIC_APP_URL}${path === "/" ? "" : path}`,
    changeFrequency: "monthly",
    priority,
  }));
}
