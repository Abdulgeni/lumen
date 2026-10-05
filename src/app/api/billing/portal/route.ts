import { ApiFailure, handle, jsonResponse, requireApiSession } from "@/server/api/http";
import { createPortalSession } from "@/server/billing/checkout";
import { checkRateLimit } from "@/server/rate-limit";

export const POST = handle(async (request) => {
  const session = await requireApiSession(request);

  const limited = await checkRateLimit(["billingPerMinute"], session.user.id);
  if (!limited.ok) {
    throw new ApiFailure(429, "RATE_LIMITED", "Please wait a moment.", {
      retryAfterSeconds: limited.retryAfterSeconds,
    });
  }

  return jsonResponse({ url: await createPortalSession(session.user.id) });
});
