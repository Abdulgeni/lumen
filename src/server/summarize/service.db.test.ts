import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { calendarMonthPeriod } from "../../lib/period";
import { getPlan } from "../../lib/plans";
import { GenerationError, type StreamEvent } from "../ai/stream";
import { db } from "../db";
import { getUsage } from "../usage";
import { createSummaryService, type ServiceDeps, type SummaryEvent } from "./service";
import { prepareSource } from "./source";

const stamp = Date.now();
const userId = `svctest_${stamp}`;
const period = calendarMonthPeriod();
const options = {
  mode: "EXECUTIVE_BRIEF",
  length: "SHORT",
  tone: "NEUTRAL",
  language: "en",
} as const;
const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");
const text = (n = 60) => ({ sourceType: "TEXT", text: words(n) }) as const;

const okGenerate: ServiceDeps["generate"] = async function* () {
  yield { type: "text", text: "# Quarterly update\n\n" };
  yield { type: "text", text: "## Bottom line\nRevenue grew." };
  yield {
    type: "done",
    model: "fake-model",
    inputTokens: 100,
    outputTokens: 20,
    finishReason: "STOP",
  };
};

function deps(overrides: Partial<ServiceDeps> = {}): ServiceDeps {
  return {
    generate: okGenerate,
    rateLimit: async () => ({ ok: true }),
    getEntitlement: async () => ({ planId: "free", plan: getPlan("free"), period }),
    prepareSource,
    ...overrides,
  };
}

async function drain(events: AsyncGenerator<SummaryEvent>) {
  const seen: SummaryEvent[] = [];
  for await (const event of events) seen.push(event);
  return seen;
}

beforeAll(async () => {
  await db.user.create({
    data: { id: userId, name: "Svc test", email: `${userId}@example.com` },
  });
});

beforeEach(async () => {
  await db.summary.deleteMany({ where: { userId } });
  await db.usageCounter.deleteMany({ where: { userId } });
});

afterAll(async () => {
  await db.user.deleteMany({ where: { id: userId } });
  await db.$disconnect();
});

const used = async () => (await getUsage(userId, period)).used;

describe("summary service", () => {
  it("completes a summary, stores it, and charges one credit", async () => {
    const { events } = await createSummaryService(deps()).start({
      userId,
      options,
      source: text(),
    });
    const seen = await drain(events);

    expect(seen.map((e) => e.type)).toEqual(["start", "delta", "delta", "done"]);
    const row = await db.summary.findFirstOrThrow({ where: { userId } });
    expect(row).toMatchObject({
      status: "COMPLETED",
      title: "Quarterly update",
      aiModel: "fake-model",
      inputTokens: 100,
      outputTokens: 20,
    });
    expect(row.resultMarkdown).toBe("## Bottom line\nRevenue grew.");
    expect(row.preview).toBe("Bottom line Revenue grew.");
    expect(await used()).toBe(1);
  });

  it("refuses Deep Dive and file uploads on the free plan without charging", async () => {
    const service = createSummaryService(deps());
    await expect(
      service.start({ userId, options: { ...options, mode: "DEEP_DIVE" }, source: text() }),
    ).rejects.toMatchObject({ status: 402, code: "MODE_NOT_ALLOWED", extra: { upgradeTo: "pro" } });
    await expect(
      service.start({
        userId,
        options,
        source: {
          sourceType: "FILE",
          file: { name: "a.txt", bytes: new TextEncoder().encode("hi") },
        },
      }),
    ).rejects.toMatchObject({ status: 402, code: "SOURCE_NOT_ALLOWED" });
    expect(await used()).toBe(0);
    expect(await db.summary.count({ where: { userId } })).toBe(0);
  });

  it("rejects too-short and too-long input without charging", async () => {
    const service = createSummaryService(deps());
    await expect(service.start({ userId, options, source: text(5) })).rejects.toMatchObject({
      status: 422,
      code: "INPUT_TOO_SHORT",
    });
    await expect(service.start({ userId, options, source: text(5_001) })).rejects.toMatchObject({
      status: 402,
      code: "INPUT_TOO_LONG",
    });
    expect(await used()).toBe(0);
  });

  it("stops at the monthly limit", async () => {
    const service = createSummaryService(deps());
    for (let i = 0; i < 10; i++) {
      const { events } = await service.start({ userId, options, source: text() });
      await drain(events);
    }
    await expect(service.start({ userId, options, source: text() })).rejects.toMatchObject({
      status: 402,
      code: "QUOTA_EXCEEDED",
      extra: { used: 10, limit: 10, upgradeTo: "pro" },
    });
    expect(await used()).toBe(10);
  });

  it("never exceeds the limit under parallel requests", async () => {
    const service = createSummaryService(deps(), { maxInFlight: 1_000 });
    const attempts = await Promise.allSettled(
      Array.from({ length: 15 }, () => service.start({ userId, options, source: text() })),
    );
    const accepted = attempts.filter((a) => a.status === "fulfilled");
    const rejected = attempts.filter((a) => a.status === "rejected");
    expect(accepted).toHaveLength(10);
    expect(rejected).toHaveLength(5);
    for (const a of rejected) expect(a.reason).toMatchObject({ code: "QUOTA_EXCEEDED" });
    await Promise.all(accepted.map((a) => drain(a.value.events)));
    expect(await used()).toBe(10);
  });

  it("refunds the credit and scrubs the excerpt when generation fails", async () => {
    const failing: ServiceDeps["generate"] = async function* () {
      yield { type: "text", text: "partial" } satisfies StreamEvent;
      throw new GenerationError("UPSTREAM_ERROR", "boom");
    };
    const { events } = await createSummaryService(deps({ generate: failing })).start({
      userId,
      options,
      source: text(),
    });
    const seen = await drain(events);

    expect(seen.at(-1)).toMatchObject({ type: "error", code: "UPSTREAM_ERROR" });
    const row = await db.summary.findFirstOrThrow({ where: { userId } });
    expect(row).toMatchObject({
      status: "FAILED",
      errorCode: "UPSTREAM_ERROR",
      sourceExcerpt: null,
    });
    expect(await used()).toBe(0);
  });

  it("refunds the credit when the client stops reading", async () => {
    const { events } = await createSummaryService(deps()).start({
      userId,
      options,
      source: text(),
    });
    await events.next();
    await events.next();
    await events.return(undefined);

    const row = await db.summary.findFirstOrThrow({ where: { userId } });
    expect(row).toMatchObject({ status: "FAILED", errorCode: "ABORTED" });
    expect(await used()).toBe(0);
  });

  it("limits summaries in flight per user", async () => {
    const pending = {
      userId,
      length: "SHORT",
      tone: "NEUTRAL",
      mode: "KEY_POINTS",
      sourceType: "TEXT",
      status: "PENDING",
    } as const;
    await db.summary.createMany({
      data: [
        { ...pending, title: "a" },
        { ...pending, title: "b" },
      ],
    });
    await expect(
      createSummaryService(deps()).start({ userId, options, source: text() }),
    ).rejects.toMatchObject({ status: 429, code: "TOO_MANY_IN_FLIGHT" });
    expect(await used()).toBe(0);
  });

  it("surfaces rate limiting with a retry time", async () => {
    const limited = deps({ rateLimit: async () => ({ ok: false, retryAfterSeconds: 12 }) });
    await expect(
      createSummaryService(limited).start({ userId, options, source: text() }),
    ).rejects.toMatchObject({
      status: 429,
      code: "RATE_LIMITED",
      extra: { retryAfterSeconds: 12 },
    });
    expect(await used()).toBe(0);
  });

  it("allows Deep Dive and sends PDFs as attachments on a paid plan", async () => {
    let seenAttachments = 0;
    const spy: ServiceDeps["generate"] = async function* (params) {
      seenAttachments = params.attachments?.length ?? 0;
      yield* okGenerate(params);
    };
    const paid = deps({
      generate: spy,
      getEntitlement: async () => ({ planId: "pro", plan: getPlan("pro"), period }),
    });
    const { events } = await createSummaryService(paid).start({
      userId,
      options: { ...options, mode: "DEEP_DIVE" },
      source: {
        sourceType: "FILE",
        file: { name: "report.pdf", bytes: new TextEncoder().encode("%PDF-1.7 body") },
      },
    });
    await drain(events);
    expect(seenAttachments).toBe(1);
    expect(await db.summary.count({ where: { userId, status: "COMPLETED" } })).toBe(1);
  });
});
