import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js keeps secrets in .env.local, but the Prisma CLI does not read it on its own.
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // Direct (unpooled) URL: migrations must not go through the pooler.
    // Empty on Vercel builds, where only `prisma generate` runs.
    url: process.env.DATABASE_URL_UNPOOLED ?? "",
  },
});
