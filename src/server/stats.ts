import type { Period } from "../lib/period";
import { bucketByDay } from "../lib/format";
import { db } from "./db";
import { listSelect } from "./summaries";

const DAY_MS = 86_400_000;

export async function getDashboardStats(userId: string, period: Period, now: Date = new Date()) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const weekStart = new Date(today - 6 * DAY_MS);
  const completed = { userId, status: "COMPLETED" } as const;

  const [totals, totalCount, recent, week] = await Promise.all([
    db.summary.aggregate({
      where: { ...completed, createdAt: { gte: period.start, lt: period.end } },
      _sum: { inputWords: true, outputWords: true },
    }),
    db.summary.count({ where: completed }),
    db.summary.findMany({
      where: completed,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 5,
      select: listSelect,
    }),
    db.summary.findMany({
      where: { ...completed, createdAt: { gte: weekStart } },
      select: { createdAt: true, inputWords: true },
    }),
  ]);

  return {
    wordsIn: totals._sum.inputWords ?? 0,
    wordsOut: totals._sum.outputWords ?? 0,
    totalCount,
    recent,
    week: bucketByDay(week, 7, now),
  };
}
