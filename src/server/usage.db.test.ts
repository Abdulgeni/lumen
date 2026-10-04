import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Period } from "../lib/period";
import { db } from "./db";
import { getUsage, reserveUsage } from "./usage";

const userId = `usagetest_${Date.now()}`;

/** Distinct far-future periods keep tests independent and away from real data. */
const period = (month: number): Period => ({
  start: new Date(Date.UTC(2040, month, 1)),
  end: new Date(Date.UTC(2040, month + 1, 1)),
});

beforeAll(async () => {
  await db.user.create({
    data: { id: userId, name: "Usage test", email: `${userId}@example.com` },
  });
});

afterAll(async () => {
  await db.user.delete({ where: { id: userId } }).catch(() => undefined);
  await db.$disconnect();
});

describe("reserveUsage", () => {
  it("never lets parallel requests exceed the limit", async () => {
    const p = period(0);
    const results = await Promise.all(
      Array.from({ length: 20 }, () => reserveUsage({ userId, limit: 10, period: p })),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(10);
    expect((await getUsage(userId, p)).used).toBe(10);
  });

  it("frees a slot when a reservation is released, exactly once", async () => {
    const p = period(1);
    const first = await reserveUsage({ userId, limit: 1, period: p });
    expect(first.ok).toBe(true);
    expect((await reserveUsage({ userId, limit: 1, period: p })).ok).toBe(false);

    if (first.ok) {
      await first.reservation.release();
      await first.reservation.release();
    }
    expect((await reserveUsage({ userId, limit: 1, period: p })).ok).toBe(true);
    expect((await reserveUsage({ userId, limit: 1, period: p })).ok).toBe(false);
    expect((await getUsage(userId, p)).used).toBe(1);
  });

  it("meters each billing period separately", async () => {
    expect((await reserveUsage({ userId, limit: 1, period: period(2) })).ok).toBe(true);
    expect((await reserveUsage({ userId, limit: 1, period: period(2) })).ok).toBe(false);
    expect((await reserveUsage({ userId, limit: 1, period: period(3) })).ok).toBe(true);
  });

  it("denies a zero limit without touching the database", async () => {
    const p = period(4);
    expect(await reserveUsage({ userId, limit: 0, period: p })).toMatchObject({ ok: false });
    expect((await getUsage(userId, p)).used).toBe(0);
  });
});
