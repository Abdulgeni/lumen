import { describe, expect, it } from "vitest";
import { bucketByDay, buildHref, compressionPercent, hoursSaved, pageWindow } from "./format";

describe("compressionPercent", () => {
  it("computes and clamps", () => {
    expect(compressionPercent(1000, 100)).toBe(90);
    expect(compressionPercent(100, 200)).toBe(0);
    expect(compressionPercent(1000, 1)).toBe(99);
  });
  it("is unknown without both counts", () => {
    expect(compressionPercent(0, 100)).toBeNull();
    expect(compressionPercent(100, 0)).toBeNull();
  });
});

describe("hoursSaved", () => {
  it("uses 220 words per minute", () => {
    expect(hoursSaved(13_200)).toBe(1);
    expect(hoursSaved(0)).toBe(0);
    expect(hoursSaved(-5)).toBe(0);
  });
});

describe("bucketByDay", () => {
  const now = new Date("2040-01-10T15:00:00Z");
  it("buckets by UTC day and drops rows outside the window", () => {
    const buckets = bucketByDay(
      [
        { createdAt: new Date("2040-01-10T01:00:00Z"), inputWords: 100 },
        { createdAt: new Date("2040-01-04T23:59:00Z"), inputWords: 50 },
        { createdAt: new Date("2040-01-03T23:59:00Z"), inputWords: 999 },
        { createdAt: new Date("2040-01-11T00:00:00Z"), inputWords: 999 },
      ],
      7,
      now,
    );
    expect(buckets).toHaveLength(7);
    expect(buckets[6]).toMatchObject({ count: 1, words: 100 });
    expect(buckets[0]).toMatchObject({ count: 1, words: 50 });
    expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(2);
  });
});

describe("pageWindow", () => {
  it("lists every page when there are few", () =>
    expect(pageWindow(2, 5)).toEqual([1, 2, 3, 4, 5]));
  it("collapses long ranges", () => {
    expect(pageWindow(1, 20)).toEqual([1, 2, "ellipsis", 20]);
    expect(pageWindow(10, 20)).toEqual([1, "ellipsis", 9, 10, 11, "ellipsis", 20]);
    expect(pageWindow(20, 20)).toEqual([1, "ellipsis", 19, 20]);
  });
});

describe("buildHref", () => {
  it("skips empty values and encodes the rest", () => {
    expect(buildHref("/x", { q: "a b", page: undefined, mode: "KEY_POINTS", empty: "" })).toBe(
      "/x?q=a+b&mode=KEY_POINTS",
    );
    expect(buildHref("/x", {})).toBe("/x");
  });
});
