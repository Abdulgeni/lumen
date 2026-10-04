import { listQuerySchema } from "@/lib/validation/summary";
import {
  handle,
  jsonResponse,
  ndjsonResponse,
  parseOrThrow,
  requireApiSession,
} from "@/server/api/http";
import { getEntitlement } from "@/server/entitlements";
import { listSummaries } from "@/server/summaries";
import { summaryService } from "@/server/summarize";
import { parseCreateRequest } from "@/server/summarize/parse-request";

export const runtime = "nodejs";
export const maxDuration = 60;

export const GET = handle(async (request) => {
  const session = await requireApiSession(request);
  const query = parseOrThrow(
    listQuerySchema,
    Object.fromEntries(new URL(request.url).searchParams),
  );
  return jsonResponse(await listSummaries(session.user.id, query));
});

export const POST = handle(async (request) => {
  const session = await requireApiSession(request);
  const entitlement = await getEntitlement(session.user.id);
  const { options, source } = await parseCreateRequest(request, entitlement);

  const abort = new AbortController();
  request.signal.addEventListener("abort", () => abort.abort(), { once: true });

  const { events } = await summaryService.start({
    userId: session.user.id,
    options,
    source,
    signal: abort.signal,
  });
  return ndjsonResponse(events, () => abort.abort());
});
