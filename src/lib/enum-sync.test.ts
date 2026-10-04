import { describe, expect, it } from "vitest";
import { SummaryLength, SummaryMode, SummarySource, SummaryTone } from "@/generated/prisma/enums";
import { SOURCE_TYPES, SUMMARY_LENGTHS, SUMMARY_MODES, SUMMARY_TONES } from "./summary-options";

const sorted = (values: readonly string[]) => [...values].sort();

describe("option lists match the database enums", () => {
  it("modes", () => expect(sorted(SUMMARY_MODES)).toEqual(sorted(Object.values(SummaryMode))));
  it("lengths", () =>
    expect(sorted(SUMMARY_LENGTHS)).toEqual(sorted(Object.values(SummaryLength))));
  it("tones", () => expect(sorted(SUMMARY_TONES)).toEqual(sorted(Object.values(SummaryTone))));
  it("sources", () => expect(sorted(SOURCE_TYPES)).toEqual(sorted(Object.values(SummarySource))));
});
