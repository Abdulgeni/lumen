import { preferencesSchema } from "@/lib/validation/summary";
import { handle, jsonResponse, parseOrThrow, requireApiSession } from "@/server/api/http";
import { db } from "@/server/db";

const DEFAULTS = {
  defaultMode: "EXECUTIVE_BRIEF",
  defaultLength: "MEDIUM",
  defaultTone: "NEUTRAL",
  outputLanguage: "en",
} as const;

const select = {
  defaultMode: true,
  defaultLength: true,
  defaultTone: true,
  outputLanguage: true,
} as const;

export const GET = handle(async (request) => {
  const session = await requireApiSession(request);
  const row = await db.userPreference.findUnique({ where: { userId: session.user.id }, select });
  return jsonResponse(row ?? DEFAULTS);
});

export const PUT = handle(async (request) => {
  const session = await requireApiSession(request);
  const body: unknown = await request.json().catch(() => null);
  const data = parseOrThrow(preferencesSchema, body);
  const row = await db.userPreference.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
    select,
  });
  return jsonResponse(row);
});
