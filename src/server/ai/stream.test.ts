import { describe, expect, it } from "vitest";
import { type GenAiChunk, type GenAiLike, type StreamEvent, streamSummary } from "./stream";

type Behavior = { reject: number } | { chunks: GenAiChunk[]; failMidStream?: boolean };

function fakeAi(behaviors: Record<string, Behavior>) {
  const calls: string[] = [];
  const ai: GenAiLike = {
    models: {
      async generateContentStream({ model }) {
        calls.push(model);
        const behavior = behaviors[model];
        if (!behavior) throw Object.assign(new Error("unknown model"), { status: 404 });
        if ("reject" in behavior)
          throw Object.assign(new Error("rejected"), { status: behavior.reject });
        return (async function* () {
          for (const chunk of behavior.chunks) yield chunk;
          if (behavior.failMidStream) throw Object.assign(new Error("mid-stream"), { status: 503 });
        })();
      },
    },
  };
  return { ai, calls };
}

async function collect(gen: AsyncGenerator<StreamEvent>) {
  const events: StreamEvent[] = [];
  for await (const event of gen) events.push(event);
  return events;
}

const params = (extra: object = {}) => ({
  models: { primary: "primary", fallback: "fallback" },
  systemInstruction: "sys",
  userContent: "content",
  ...extra,
});

const ok: GenAiChunk[] = [
  { text: "# Title\n" },
  {
    text: "Body",
    usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
    candidates: [{ finishReason: "STOP" }],
  },
];

describe("streamSummary", () => {
  it("streams text and reports usage", async () => {
    const { ai } = fakeAi({ primary: { chunks: ok } });
    const events = await collect(streamSummary(ai, params()));
    expect(events.filter((e) => e.type === "text")).toHaveLength(2);
    expect(events.at(-1)).toEqual({
      type: "done",
      model: "primary",
      inputTokens: 10,
      outputTokens: 5,
      finishReason: "STOP",
    });
  });

  it("falls back when the primary model is unavailable before any text", async () => {
    const { ai, calls } = fakeAi({ primary: { reject: 404 }, fallback: { chunks: ok } });
    const events = await collect(streamSummary(ai, params()));
    expect(calls).toEqual(["primary", "fallback"]);
    expect(events.at(-1)).toMatchObject({ type: "done", model: "fallback" });
  });

  it("never falls back once text has started streaming", async () => {
    const { ai, calls } = fakeAi({
      primary: { chunks: [{ text: "partial" }], failMidStream: true },
      fallback: { chunks: ok },
    });
    await expect(collect(streamSummary(ai, params()))).rejects.toMatchObject({
      code: "UPSTREAM_ERROR",
    });
    expect(calls).toEqual(["primary"]);
  });

  it("maps rate limiting when every model is rate limited", async () => {
    const { ai } = fakeAi({ primary: { reject: 429 }, fallback: { reject: 429 } });
    await expect(collect(streamSummary(ai, params()))).rejects.toMatchObject({
      code: "RATE_LIMITED",
    });
  });

  it("reports blocked content", async () => {
    const { ai } = fakeAi({ primary: { chunks: [{ candidates: [{ finishReason: "SAFETY" }] }] } });
    await expect(collect(streamSummary(ai, params()))).rejects.toMatchObject({ code: "BLOCKED" });
  });

  it("reports empty output", async () => {
    const { ai } = fakeAi({ primary: { chunks: [{ candidates: [{ finishReason: "STOP" }] }] } });
    await expect(collect(streamSummary(ai, params()))).rejects.toMatchObject({
      code: "EMPTY_OUTPUT",
    });
  });

  it("reports cancellation", async () => {
    const { ai } = fakeAi({ primary: { reject: 503 } });
    const controller = new AbortController();
    controller.abort();
    await expect(
      collect(streamSummary(ai, params({ signal: controller.signal }))),
    ).rejects.toMatchObject({ code: "ABORTED" });
  });
});
