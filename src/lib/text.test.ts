import { describe, expect, it } from "vitest";
import { escapeLike, fallbackTitle, makePreview } from "./text";

describe("makePreview", () => {
  it("strips Markdown syntax", () => {
    const md =
      "## Bottom line\nRevenue **grew** 18% — see [report](https://x.com).\n\n- Costs rose\n- Hiring";
    expect(makePreview(md)).toBe("Bottom line Revenue grew 18% — see report. Costs rose Hiring");
  });
  it("truncates long text with an ellipsis", () => {
    const preview = makePreview("word ".repeat(200), 50);
    expect(preview.length).toBe(50);
    expect(preview.endsWith("…")).toBe(true);
  });
});

describe("fallbackTitle", () => {
  it("prefers the hint", () =>
    expect(fallbackTitle("Annual report", "ignored")).toBe("Annual report"));
  it("falls back to the first words", () => {
    expect(fallbackTitle(null, "one two three four five six seven eight nine ten eleven")).toBe(
      "one two three four five six seven eight nine ten",
    );
  });
  it("handles empty input", () => expect(fallbackTitle(null, "   ")).toBe("Untitled summary"));
  it("caps long hints", () => expect(fallbackTitle("x".repeat(200), "").length).toBe(70));
});

describe("escapeLike", () => {
  it("escapes wildcards and the escape character itself", () => {
    expect(escapeLike("100%")).toBe("100\\%");
    expect(escapeLike("snake_case")).toBe("snake\\_case");
    expect(escapeLike("C:\\temp")).toBe("C:\\\\temp");
  });
  it("leaves ordinary text alone", () => {
    expect(escapeLike("harbor ferries")).toBe("harbor ferries");
  });
  it("handles empty input", () => {
    expect(escapeLike("")).toBe("");
  });
});
