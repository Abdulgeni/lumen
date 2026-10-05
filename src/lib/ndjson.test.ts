import { describe, expect, it } from "vitest";
import { createLineParser } from "./ndjson";

function collect(chunks: string[], flush = true) {
  const items: unknown[] = [];
  const parser = createLineParser((item) => items.push(item));
  for (const chunk of chunks) parser.push(chunk);
  if (flush) parser.flush();
  return items;
}

describe("createLineParser", () => {
  it("parses several lines in one chunk", () => {
    expect(collect(['{"a":1}\n{"a":2}\n'])).toEqual([{ a: 1 }, { a: 2 }]);
  });
  it("reassembles a line split across chunks", () => {
    expect(collect(['{"te', 'xt":"hel', 'lo"}\n'])).toEqual([{ text: "hello" }]);
  });
  it("ignores blank lines", () => {
    expect(collect(['\n{"a":1}\n\n'])).toEqual([{ a: 1 }]);
  });
  it("flushes a final line with no trailing newline", () => {
    expect(collect(['{"a":1}'])).toEqual([{ a: 1 }]);
    expect(collect(['{"a":1}'], false)).toEqual([]);
  });
  it("throws on malformed JSON so callers can report it", () => {
    expect(() => collect(["not json\n"])).toThrow();
  });
});
