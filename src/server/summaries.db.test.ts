import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { listQuerySchema } from "../lib/validation/summary";
import { db } from "./db";
import { deleteSummary, getSummary, listSummaries, updateSummary } from "./summaries";

const stamp = Date.now();
const userA = `sumtest_a_${stamp}`;
const userB = `sumtest_b_${stamp}`;
const q = (input: Record<string, string> = {}) => listQuerySchema.parse(input);

const base = { length: "MEDIUM", tone: "NEUTRAL", outputLanguage: "en" } as const;

beforeAll(async () => {
  for (const id of [userA, userB]) {
    await db.user.create({ data: { id, name: id, email: `${id}@example.com` } });
  }
  await db.summary.createMany({
    data: Array.from({ length: 30 }, (_, i) => ({
      ...base,
      userId: userA,
      title: `Report ${i}`,
      sourceType: i % 2 === 1 ? ("URL" as const) : ("TEXT" as const),
      mode: i % 3 === 0 ? ("DEEP_DIVE" as const) : ("EXECUTIVE_BRIEF" as const),
      resultMarkdown:
        i % 5 === 0
          ? "Mentions 100% growth and harbor ferries"
          : i === 7
            ? "Uses snake_case naming"
            : i === 8
              ? "Saved to C:\\temp\\report"
              : "Plain body text",
      isFavorite: i % 10 === 0,
      status: "COMPLETED" as const,
      createdAt: new Date(Date.UTC(2040, 0, 1, 0, 0, i)),
    })),
  });
  await db.summary.createMany({
    data: [
      {
        ...base,
        userId: userA,
        title: "Still pending",
        sourceType: "TEXT",
        mode: "KEY_POINTS",
        status: "PENDING",
      },
      {
        ...base,
        userId: userA,
        title: "Failed one",
        sourceType: "TEXT",
        mode: "KEY_POINTS",
        status: "FAILED",
      },
      {
        ...base,
        userId: userB,
        title: "Secret of B",
        sourceType: "TEXT",
        mode: "KEY_POINTS",
        status: "COMPLETED",
      },
    ],
  });
});

afterAll(async () => {
  await db.user.deleteMany({ where: { id: { in: [userA, userB] } } });
  await db.$disconnect();
});

describe("listSummaries", () => {
  it("paginates newest first without duplicates", async () => {
    const p1 = await listSummaries(userA, q());
    const p2 = await listSummaries(userA, q({ page: "2" }));
    const p3 = await listSummaries(userA, q({ page: "3" }));
    expect(p1).toMatchObject({ total: 30, totalPages: 3, page: 1 });
    expect(p1.items).toHaveLength(12);
    expect(p3.items).toHaveLength(6);
    expect(p1.items[0]?.title).toBe("Report 29");
    const ids = [...p1.items, ...p2.items, ...p3.items].map((s) => s.id);
    expect(new Set(ids).size).toBe(30);
  });

  it("hides pending and failed summaries", async () => {
    const all = await listSummaries(userA, q({ pageSize: "50" }));
    expect(all.items.map((s) => s.title)).not.toContain("Still pending");
    expect(all.items.map((s) => s.title)).not.toContain("Failed one");
  });

  it("searches titles and bodies case-insensitively", async () => {
    expect((await listSummaries(userA, q({ q: "report 7" }))).total).toBe(1);
    expect((await listSummaries(userA, q({ q: "HARBOR" }))).total).toBe(6);
  });

  it("treats LIKE wildcards literally rather than as patterns", async () => {
    expect((await listSummaries(userA, q({ q: "%" }))).total).toBe(6);
    expect((await listSummaries(userA, q({ q: "100%" }))).total).toBe(6);
    expect((await listSummaries(userA, q({ q: "_" }))).total).toBe(1);
    expect((await listSummaries(userA, q({ q: "\\" }))).total).toBe(1);
  });

  it("filters by favorite, mode and source", async () => {
    expect((await listSummaries(userA, q({ favorite: "true" }))).total).toBe(3);
    expect((await listSummaries(userA, q({ mode: "DEEP_DIVE" }))).total).toBe(10);
    expect((await listSummaries(userA, q({ source: "URL" }))).total).toBe(15);
  });

  it("sorts oldest first on request", async () => {
    expect((await listSummaries(userA, q({ sort: "oldest" }))).items[0]?.title).toBe("Report 0");
  });
});

describe("ownership", () => {
  it("never shows one user's summaries to another", async () => {
    const mine = await listSummaries(userB, q({ pageSize: "50" }));
    expect(mine.items.map((s) => s.title)).toEqual(["Secret of B"]);
  });

  it("blocks reading, editing and deleting someone else's summary", async () => {
    const target = (await listSummaries(userA, q())).items[0];
    if (!target) throw new Error("fixture missing");

    expect(await getSummary(userB, target.id)).toBeNull();
    expect(await updateSummary(userB, target.id, { title: "Hijacked" })).toBeNull();
    expect(await deleteSummary(userB, target.id)).toBe(false);

    const intact = await getSummary(userA, target.id);
    expect(intact?.title).toBe(target.title);
  });

  it("lets the owner rename, favorite and delete", async () => {
    const target = (await listSummaries(userA, q())).items[0];
    if (!target) throw new Error("fixture missing");

    const updated = await updateSummary(userA, target.id, { title: "Renamed", isFavorite: true });
    expect(updated).toMatchObject({ title: "Renamed", isFavorite: true });
    expect(await deleteSummary(userA, target.id)).toBe(true);
    expect(await getSummary(userA, target.id)).toBeNull();
  });
});
