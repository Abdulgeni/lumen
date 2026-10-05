import { preferencesSchema } from "@/lib/validation/summary";
import { handle, jsonResponse, parseOrThrow, requireApiSession } from "@/server/api/http";
import { getPreferences, savePreferences } from "@/server/preferences";

export const GET = handle(async (request) => {
  const session = await requireApiSession(request);
  return jsonResponse(await getPreferences(session.user.id));
});

export const PUT = handle(async (request) => {
  const session = await requireApiSession(request);
  const body: unknown = await request.json().catch(() => null);
  const data = parseOrThrow(preferencesSchema, body);
  return jsonResponse(await savePreferences(session.user.id, data));
});
