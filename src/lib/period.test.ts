import { describe, expect, it } from "vitest";
import { calendarMonthPeriod, resolvePeriod } from "./period";

describe("calendarMonthPeriod", () => {
  it("covers the UTC calendar month", () => {
    const p = calendarMonthPeriod(new Date("2026-10-15T12:00:00Z"));
    expect(p.start.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(p.end.toISOString()).toBe("2026-11-01T00:00:00.000Z");
  });

  it("rolls over the year in December", () => {
    const p = calendarMonthPeriod(new Date("2026-12-31T23:59:59Z"));
    expect(p.end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("uses UTC at the month boundary regardless of local time zone", () => {
    const p = calendarMonthPeriod(new Date("2026-11-01T00:00:00Z"));
    expect(p.start.toISOString()).toBe("2026-11-01T00:00:00.000Z");
  });
});

describe("resolvePeriod", () => {
  const sub = {
    periodStart: new Date("2026-10-10T00:00:00Z"),
    periodEnd: new Date("2026-11-10T00:00:00Z"),
  };

  it("uses the billing period while the subscription is current", () => {
    expect(resolvePeriod(sub, new Date("2026-10-20T00:00:00Z"))).toEqual({
      start: sub.periodStart,
      end: sub.periodEnd,
    });
  });

  it("falls back to the calendar month when there is no subscription or it has lapsed", () => {
    expect(resolvePeriod(null, new Date("2026-10-20T00:00:00Z")).start.toISOString()).toBe(
      "2026-10-01T00:00:00.000Z",
    );
    expect(resolvePeriod(sub, new Date("2026-11-20T00:00:00Z")).start.toISOString()).toBe(
      "2026-11-01T00:00:00.000Z",
    );
  });
});
