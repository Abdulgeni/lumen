import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { reapStaleSummaries, runMaintenance } from "./maintenance";

const userId = `maint_${Date.now()}`;
const DAY = 86_400_000;
const MINUTE = 60_000;
const now = new Date();
const ago = (ms: number) => new Date(now.getTime() - ms);
const periodStart = new Date(Date.UTC(2040, 5, 1));
const base = {
  userId,
  sourceType: "TEXT",
  mode: "KEY_POINTS",
  length: "SHORT",
  tone: "NEUTRAL",
} as const;

async function counter() {
  const row = await db.usageCounter.findUnique({
    where: { userId_kind_periodStart: { userId, kind: "SUMMARY", periodStart } },
    select: { used: true },
  });
  return row?.used ?? 0;
}

beforeAll(async () => {
  await db.user.create({
    data: { id: userId, name: "Maintenance test", email: `${userId}@example.com` },
  });
});

beforeEach(async () => {
  await db.summary.deleteMany({ where: { userId } });
  await db.usageCounter.deleteMany({ where: { userId } });
  await db.usageCounter.create({
    data: {
      userId,
      kind: "SUMMARY",
      periodStart,
      periodEnd: new Date(Date.UTC(2040, 6, 1)),
      used: 3,
    },
  });
});

afterAll(async () => {
  await db.user.deleteMany({ where: { id: userId } });
  await db.$disconnect();
});

describe("reapStaleSummaries", () => {
  it("fails stale runs and refunds exactly one credit each, only once", async () => {
    await db.summary.createMany({
      data: [
        {
          ...base,
          title: "stale 1",
          status: "PENDING",
          usagePeriodStart: periodStart,
          createdAt: ago(30 * MINUTE),
        },
        {
          ...base,
          title: "stale 2",
          status: "PENDING",
          usagePeriodStart: periodStart,
          createdAt: ago(20 * MINUTE),
        },
        {
          ...base,
          title: "fresh",
          status: "PENDING",
          usagePeriodStart: periodStart,
          createdAt: ago(MINUTE),
        },
      ],
    });

    expect(await reapStaleSummaries(now)).toBe(2);
    expect(await counter()).toBe(1);
    expect(await reapStaleSummaries(now)).toBe(0);
    expect(await counter()).toBe(1);

    const rows = await db.summary.findMany({
      where: { userId },
      select: { title: true, status: true, errorCode: true },
    });
    expect(rows.find((r) => r.title === "fresh")?.status).toBe("PENDING");
    expect(rows.find((r) => r.title === "stale 1")).toMatchObject({
      status: "FAILED",
      errorCode: "TIMEOUT",
    });
  });

  it("fails old runs without a recorded period but refunds nothing", async () => {
    await db.summary.create({
      data: { ...base, title: "legacy", status: "PENDING", createdAt: ago(30 * MINUTE) },
    });
    expect(await reapStaleSummaries(now)).toBe(1);
    expect(await counter()).toBe(3);
  });
});

describe("runMaintenance", () => {
  it("deletes old failures and expired records but never completed summaries", async () => {
    await db.summary.createMany({
      data: [
        { ...base, title: "old failed", status: "FAILED", createdAt: ago(8 * DAY) },
        { ...base, title: "recent failed", status: "FAILED", createdAt: ago(2 * DAY) },
        { ...base, title: "ancient completed", status: "COMPLETED", createdAt: ago(900 * DAY) },
      ],
    });
    await db.verification.create({
      data: { id: `v_${userId}`, identifier: "x", value: "y", expiresAt: ago(DAY) },
    });
    await db.stripeEvent.create({
      data: { id: `evt_${userId}`, type: "test", processedAt: ago(100 * DAY) },
    });

    const result = await runMaintenance(now);
    expect(result.deletedFailedSummaries).toBeGreaterThanOrEqual(1);
    expect(result.deletedVerifications).toBeGreaterThanOrEqual(1);
    expect(result.deletedStripeEvents).toBeGreaterThanOrEqual(1);

    const titles = (await db.summary.findMany({ where: { userId }, select: { title: true } })).map(
      (s) => s.title,
    );
    expect(titles).toContain("recent failed");
    expect(titles).toContain("ancient completed");
    expect(titles).not.toContain("old failed");
  });
});
