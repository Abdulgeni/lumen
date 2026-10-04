import { describe, expect, it } from "vitest";
import { createSummaryJsonSchema, listQuerySchema, updateSummarySchema } from "./summary";

describe("createSummaryJsonSchema", () => {
  it("applies defaults", () => {
    const parsed = createSummaryJsonSchema.parse({
      sourceType: "TEXT",
      text: "hello",
      mode: "KEY_POINTS",
    });
    expect(parsed).toMatchObject({ length: "MEDIUM", tone: "NEUTRAL", language: "en" });
  });
  it("rejects unknown modes, missing sources and file requests over JSON", () => {
    expect(
      createSummaryJsonSchema.safeParse({ sourceType: "TEXT", text: "x", mode: "NOPE" }).success,
    ).toBe(false);
    expect(
      createSummaryJsonSchema.safeParse({ sourceType: "URL", mode: "KEY_POINTS" }).success,
    ).toBe(false);
    expect(
      createSummaryJsonSchema.safeParse({ sourceType: "FILE", mode: "KEY_POINTS" }).success,
    ).toBe(false);
  });
});

describe("listQuerySchema", () => {
  it("applies defaults", () => {
    expect(listQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 12, sort: "newest" });
  });
  it("coerces numbers and treats blank search as absent", () => {
    const parsed = listQuerySchema.parse({ page: "3", pageSize: "20", q: "   " });
    expect(parsed).toMatchObject({ page: 3, pageSize: 20 });
    expect(parsed.q).toBeUndefined();
  });
  it("bounds page size and page", () => {
    expect(listQuerySchema.safeParse({ pageSize: "500" }).success).toBe(false);
    expect(listQuerySchema.safeParse({ page: "0" }).success).toBe(false);
  });
});

describe("updateSummarySchema", () => {
  it("requires at least one field", () => {
    expect(updateSummarySchema.safeParse({}).success).toBe(false);
    expect(updateSummarySchema.safeParse({ isFavorite: true }).success).toBe(true);
  });
});
