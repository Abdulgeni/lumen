import { db } from "./db";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/**
 * A summary stuck in PENDING means the function died mid-run. Fail it and give the credit back.
 * Claiming each row with a conditional update keeps this safe to run twice or concurrently.
 */
export async function reapStaleSummaries(
  now: Date = new Date(),
  olderThanMs = 10 * MINUTE,
  batch = 200,
) {
  const stale = await db.summary.findMany({
    where: { status: "PENDING", createdAt: { lt: new Date(now.getTime() - olderThanMs) } },
    select: { id: true, userId: true, usagePeriodStart: true },
    take: batch,
  });

  let reaped = 0;
  for (const row of stale) {
    const claimed = await db.summary.updateMany({
      where: { id: row.id, status: "PENDING" },
      data: { status: "FAILED", errorCode: "TIMEOUT", sourceExcerpt: null },
    });
    if (claimed.count === 0) continue;
    reaped += 1;
    if (row.usagePeriodStart) {
      await db.usageCounter.updateMany({
        where: {
          userId: row.userId,
          kind: "SUMMARY",
          periodStart: row.usagePeriodStart,
          used: { gt: 0 },
        },
        data: { used: { decrement: 1 } },
      });
    }
  }
  return reaped;
}

export async function runMaintenance(now: Date = new Date()) {
  const reaped = await reapStaleSummaries(now);
  const [failedSummaries, stripeEvents, verifications, sessions, rateLimits] = await Promise.all([
    db.summary.deleteMany({
      where: { status: "FAILED", createdAt: { lt: new Date(now.getTime() - 7 * DAY) } },
    }),
    db.stripeEvent.deleteMany({
      where: { processedAt: { lt: new Date(now.getTime() - 90 * DAY) } },
    }),
    db.verification.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.rateLimit.deleteMany({ where: { lastRequest: { lt: BigInt(now.getTime() - DAY) } } }),
  ]);

  return {
    reapedStaleSummaries: reaped,
    deletedFailedSummaries: failedSummaries.count,
    deletedStripeEvents: stripeEvents.count,
    deletedVerifications: verifications.count,
    deletedSessions: sessions.count,
    deletedRateLimits: rateLimits.count,
  };
}
