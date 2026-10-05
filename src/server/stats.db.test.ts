import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "./db";
import { getDashboardStats } from "./stats";

const userId = `stattest_${Date.now()}`;
const now = new Date();
const ago = (ms: number) => new Date(now.getTime() - ms);
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const base = {
  userId,
  sourceType: "TEXT",
  mode: "KEY_POINTS",
  length: "SHORT",
  tone: "NEUTRAL",
} as const;

beforeAll(async () => {
  await db.user.create({
    data: { id: userId, name: "Stat test", email: `${userId}@example.com` },
  });
  await db.summary.createMany({
    data: [
      {
        ...base,
        title: "A",
        status: "COMPLETED",
        inputWords: 1000,
        outputWords: 100,
        createdAt: ago(HOUR),
      },
      {
        ...base,
        title: "B",
        status: "COMPLETED",
        inputWords: 500,
        outputWords: 50,
        createdAt: ago(2 * DAY),
      },
      {
        ...base,
        title: "C",
        status: "COMPLETED",
        inputWords: 700,
        outputWords: 70,
        createdAt: ago(40 * DAY),
      },
      {
        ...base,
        title: "D",
        status: "FAILED",
        inputWords: 9999,
        outputWords: 0,
        createdAt: ago(HOUR),
      },
    ],
  });
});

afterAll(async () => {
  await db.user.deleteMany({ where: { id: userId } });
  await db.$disconnect();
});

describe("getDashboardStats", () => {
  it("totals the period, ignores failures, and reports recents and the week", async () => {
    const stats = await getDashboardStats(
      userId,
      { start: ago(10 * DAY), end: new Date(now.getTime() + DAY) },
      now,
    );
    expect(stats).toMatchObject({ wordsIn: 1500, wordsOut: 150, totalCount: 3 });
    expect(stats.recent.map((s) => s.title)).toEqual(["A", "B", "C"]);
    expect(stats.week).toHaveLength(7);
    expect(stats.week.reduce((sum, d) => sum + d.count, 0)).toBe(2);
  });
});
