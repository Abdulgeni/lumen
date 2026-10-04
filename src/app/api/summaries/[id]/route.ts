import { idSchema, updateSummarySchema } from "@/lib/validation/summary";
import {
  ApiFailure,
  handle,
  jsonResponse,
  parseOrThrow,
  requireApiSession,
} from "@/server/api/http";
import { deleteSummary, getSummary, updateSummary } from "@/server/summaries";

type Context = { params: Promise<{ id: string }> };

const notFound = () => new ApiFailure(404, "NOT_FOUND", "That summary was not found.");

export const GET = handle<Context>(async (request, { params }) => {
  const session = await requireApiSession(request);
  const id = parseOrThrow(idSchema, (await params).id);
  const summary = await getSummary(session.user.id, id);
  if (!summary) throw notFound();
  return jsonResponse(summary);
});

export const PATCH = handle<Context>(async (request, { params }) => {
  const session = await requireApiSession(request);
  const id = parseOrThrow(idSchema, (await params).id);
  const body: unknown = await request.json().catch(() => null);
  const patch = parseOrThrow(updateSummarySchema, body);
  const summary = await updateSummary(session.user.id, id, patch);
  if (!summary) throw notFound();
  return jsonResponse(summary);
});

export const DELETE = handle<Context>(async (request, { params }) => {
  const session = await requireApiSession(request);
  const id = parseOrThrow(idSchema, (await params).id);
  if (!(await deleteSummary(session.user.id, id))) throw notFound();
  return jsonResponse({ ok: true });
});
