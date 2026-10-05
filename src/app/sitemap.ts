import type { MetadataRoute } from "next";
import { env } from "@/env";
import { MARKETING_ROUTES } from "@/lib/routes";

export default function sitemap(): MetadataRoute.Sitemap {
  return Object.values(MARKETING_ROUTES).map((path) => ({
    url: `${env.NEXT_PUBLIC_APP_URL}${path === "/" ? "" : path}`,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
