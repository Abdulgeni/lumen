import { z } from "zod";
import { PAID_PLAN_IDS } from "@/lib/billing";
import {
  ApiFailure,
  handle,
  jsonResponse,
  parseOrThrow,
  requireApiSession,
} from "@/server/api/http";
import { createCheckoutSession } from "@/server/billing/checkout";
import { checkRateLimit } from "@/server/rate-limit";

const bodySchema = z.object({ plan: z.enum(PAID_PLAN_IDS) });

export const POST = handle(async (request) => {
  const session = await requireApiSession(request);

  const limited = await checkRateLimit(["billingPerMinute"], session.user.id);
  if (!limited.ok) {
    throw new ApiFailure(429, "RATE_LIMITED", "Please wait a moment.", {
      retryAfterSeconds: limited.retryAfterSeconds,
    });
  }

  const { plan } = parseOrThrow(bodySchema, await request.json().catch(() => null));
  const url = await createCheckoutSession({ user: session.user, plan });
  return jsonResponse({ url });
});
