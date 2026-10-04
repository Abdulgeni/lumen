import type { Period } from "../lib/period";
import { db } from "./db";

type UsageKind = "SUMMARY";

export type Reservation = { release: () => Promise<void> };

export type ReserveResult =
  { ok: true; reservation: Reservation } | { ok: false; used: number; limit: number };

/**
 * Atomically claims one unit of quota. Call release() if the work then fails, so the
 * user is only charged for summaries they actually received.
 */
export async function reserveUsage(input: {
  userId: string;
  limit: number;
  period: Period;
  kind?: UsageKind;
}): Promise<ReserveResult> {
  const key = {
    userId: input.userId,
    kind: input.kind ?? "SUMMARY",
    periodStart: input.period.start,
  } as const;

  if (input.limit < 1) return { ok: false, used: 0, limit: input.limit };

  await db.usageCounter.createMany({
    data: [{ ...key, periodEnd: input.period.end }],
    skipDuplicates: true,
  });

  const { count } = await db.usageCounter.updateMany({
    where: { ...key, used: { lt: input.limit } },
    data: { used: { increment: 1 } },
  });

  if (count === 0) {
    const row = await db.usageCounter.findUnique({
      where: { userId_kind_periodStart: key },
      select: { used: true },
    });
    return { ok: false, used: row?.used ?? input.limit, limit: input.limit };
  }

  let released = false;
  return {
    ok: true,
    reservation: {
      release: async () => {
        if (released) return;
        released = true;
        await db.usageCounter.updateMany({
          where: { ...key, used: { gt: 0 } },
          data: { used: { decrement: 1 } },
        });
      },
    },
  };
}

export async function getUsage(userId: string, period: Period, kind: UsageKind = "SUMMARY") {
  const row = await db.usageCounter.findUnique({
    where: { userId_kind_periodStart: { userId, kind, periodStart: period.start } },
    select: { used: true },
  });
  return { used: row?.used ?? 0 };
}
