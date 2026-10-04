import { describe, expect, it } from "vitest";
import { type GenAiLike, streamSummary } from "./stream";

describe("streamSummary attachments", () => {
  it("sends PDFs as base64 inline data ahead of the prompt text", async () => {
    let seen: unknown;
    const ai: GenAiLike = {
      models: {
        async generateContentStream({ contents }) {
          seen = contents;
          return (async function* () {
            yield { text: "ok", candidates: [{ finishReason: "STOP" }] };
          })();
        },
      },
    };

    const events = [];
    for await (const event of streamSummary(ai, {
      models: { primary: "m" },
      systemInstruction: "sys",
      userContent: "prompt",
      attachments: [{ mimeType: "application/pdf", data: new TextEncoder().encode("%PDF-1.7") }],
    })) {
      events.push(event);
    }

    expect(events.at(-1)).toMatchObject({ type: "done" });
    expect(seen).toEqual([
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: Buffer.from("%PDF-1.7").toString("base64"),
            },
          },
          { text: "prompt" },
        ],
      },
    ]);
  });
});
