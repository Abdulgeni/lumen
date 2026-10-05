import { describe, expect, it } from "vitest";
import { checkEntitlements, getPlan, nextPlan, planFeatures } from "./plans";

const base = { mode: "EXECUTIVE_BRIEF", sourceType: "TEXT", inputWords: 100 } as const;

describe("checkEntitlements", () => {
  it("allows a normal free request", () => {
    expect(checkEntitlements("free", base)).toBeNull();
  });
  it("blocks Deep Dive on free and points to pro", () => {
    expect(checkEntitlements("free", { ...base, mode: "DEEP_DIVE" })).toMatchObject({
      code: "MODE_NOT_ALLOWED",
      upgradeTo: "pro",
    });
  });
  it("blocks file uploads on free", () => {
    expect(
      checkEntitlements("free", { ...base, sourceType: "FILE", fileBytes: 1000 }),
    ).toMatchObject({ code: "SOURCE_NOT_ALLOWED", upgradeTo: "pro" });
  });
  it("blocks oversize input and recommends the cheapest plan that fits", () => {
    expect(checkEntitlements("free", { ...base, inputWords: 6_000 })).toMatchObject({
      code: "INPUT_TOO_LONG",
      upgradeTo: "pro",
    });
    expect(checkEntitlements("pro", { ...base, inputWords: 60_000 })).toMatchObject({
      code: "INPUT_TOO_LONG",
      upgradeTo: "team",
    });
  });
  it("rejects files over the size limit", () => {
    expect(
      checkEntitlements("pro", { ...base, sourceType: "FILE", fileBytes: 5 * 1024 * 1024 }),
    ).toMatchObject({ code: "FILE_TOO_LARGE" });
  });
  it("allows everything within limits on pro", () => {
    expect(
      checkEntitlements("pro", {
        mode: "DEEP_DIVE",
        sourceType: "FILE",
        inputWords: 40_000,
        fileBytes: 1_000_000,
      }),
    ).toBeNull();
  });
});

describe("nextPlan", () => {
  it("walks up the tiers", () => {
    expect(nextPlan("free")).toBe("pro");
    expect(nextPlan("pro")).toBe("team");
    expect(nextPlan("team")).toBeNull();
  });
});

describe("planFeatures", () => {
  it("describes limits from the config", () => {
    const free = planFeatures(getPlan("free"));
    expect(free[0]).toBe("10 summaries per month");
    expect(free[2]).toBe("Executive Brief and Key Points");
    expect(free[3]).toBe("Text and web links");
  });
  it("mentions uploads and Deep Dive on paid plans", () => {
    const pro = planFeatures(getPlan("pro")).join(" | ");
    expect(pro).toContain("Deep Dive");
    expect(pro).toContain("uploads");
    expect(pro).toContain("300 summaries per month");
  });
});
