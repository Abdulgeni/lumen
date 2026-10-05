import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "../env";

type Window = Parameters<typeof Ratelimit.slidingWindow>[1];

const POLICIES = {
  summarizePerMinute: { requests: 6, window: "1 m" },
  summarizePerHour: { requests: 60, window: "1 h" },
  billingPerMinute: { requests: 10, window: "1 m" },
} as const satisfies Record<string, { requests: number; window: Window }>;

export type RateLimitPolicy = keyof typeof POLICIES;
export const SUMMARIZE_POLICIES: RateLimitPolicy[] = ["summarizePerMinute", "summarizePerHour"];

let redis: Redis | undefined;
const limiters = new Map<RateLimitPolicy, Ratelimit>();

function getLimiter(policy: RateLimitPolicy): Ratelimit {
  let limiter = limiters.get(policy);
  if (!limiter) {
    redis ??= new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN });
    const { requests, window } = POLICIES[policy];
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      prefix: `lumen:rl:${policy}`,
      analytics: false,
    });
    limiters.set(policy, limiter);
  }
  return limiter;
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

/** All listed policies must pass. Fails open if Redis is unreachable; the DB quota is the hard ceiling. */
export async function checkRateLimit(
  policies: RateLimitPolicy[],
  key: string,
): Promise<RateLimitResult> {
  try {
    for (const policy of policies) {
      const result = await getLimiter(policy).limit(key);
      if (!result.success) {
        return {
          ok: false,
          retryAfterSeconds: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
        };
      }
    }
    return { ok: true };
  } catch (error) {
    console.error(
      "[rate-limit] unavailable, allowing request:",
      error instanceof Error ? error.name : "unknown",
    );
    return { ok: true };
  }
}
