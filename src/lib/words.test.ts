import { describe, expect, it } from "vitest";
import { countWords } from "./words";

describe("countWords", () => {
  it("counts space-separated words", () => {
    expect(countWords("Hello brave new world")).toBe(4);
  });
  it("ignores punctuation and whitespace", () => {
    expect(countWords("  Hello,   world!  \n\n ")).toBe(2);
  });
  it("counts words in languages written without spaces", () => {
    expect(countWords("我喜欢吃苹果和香蕉")).toBeGreaterThan(1);
  });
  it("returns zero for empty input", () => {
    expect(countWords("")).toBe(0);
  });
});
