import { timingSafeEqual } from "node:crypto";
import { env } from "@/env";
import { runMaintenance } from "@/server/maintenance";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(header: string | null): boolean {
  const given = Buffer.from(header ?? "");
  const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  if (!authorized(request.headers.get("authorization"))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await runMaintenance();
  console.log("[maintenance]", JSON.stringify(result));
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
