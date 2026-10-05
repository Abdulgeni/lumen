import "./load-env";
import { randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import type { Page } from "@playwright/test";
import { db } from "../../src/server/db";

export type TestUser = { id: string; email: string; password: string; name: string };

/** Creates a verified email-and-password user straight in the database, so no email is ever sent. */
export async function createTestUser(label: string): Promise<TestUser> {
  const id = `e2e_${label}_${Date.now()}`;
  const user = {
    id,
    email: `${id}@example.com`,
    password: `Pw-${randomBytes(9).toString("hex")}!`,
    name: `E2E ${label}`,
  };
  await db.user.create({ data: { id, name: user.name, email: user.email, emailVerified: true } });
  await db.account.create({
    data: {
      id: `acc_${id}`,
      accountId: id,
      providerId: "credential",
      userId: id,
      password: await hashPassword(user.password),
    },
  });
  return user;
}

export async function deleteTestUsers(ids: string[]) {
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
}

export async function seedSummaries(userId: string) {
  const base = {
    userId,
    sourceType: "TEXT",
    length: "MEDIUM",
    tone: "NEUTRAL",
    status: "COMPLETED",
    aiModel: "e2e",
    inputWords: 500,
    outputWords: 60,
  } as const;
  const rows = [
    {
      ...base,
      title: "Quarterly harbor report",
      mode: "EXECUTIVE_BRIEF",
      resultMarkdown: "## Bottom line\nFerry traffic rose.",
      preview: "Bottom line Ferry traffic rose.",
    },
    {
      ...base,
      title: "Coffee wholesale notes",
      mode: "KEY_POINTS",
      resultMarkdown: "- Wholesale grew\n- Costs rose",
      preview: "Wholesale grew Costs rose",
    },
    {
      ...base,
      title: "Security audit summary",
      mode: "KEY_POINTS",
      resultMarkdown: "- Two findings",
      preview: "Two findings",
    },
  ] as const;
  await db.summary.createMany({
    data: rows.map((row, i) => ({ ...row, createdAt: new Date(Date.now() - i * 60_000) })),
  });
  return db.summary.findMany({
    where: { userId },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function signIn(page: Page, user: TestUser, next = "/dashboard") {
  await page.goto(`/sign-in?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
