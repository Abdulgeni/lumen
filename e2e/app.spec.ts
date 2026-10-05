import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import {
  createTestUser,
  deleteTestUsers,
  seedSummaries,
  signIn,
  type TestUser,
} from "./support/users";

test.describe.configure({ mode: "serial" });

let userA: TestUser;
let userB: TestUser;
let contextA: BrowserContext;
let contextB: BrowserContext;
let pageA: Page;
let pageB: Page;
let summaries: { id: string; title: string }[];

test.beforeAll(async ({ browser }) => {
  userA = await createTestUser("alice");
  userB = await createTestUser("bob");
  summaries = await seedSummaries(userA.id);
  contextA = await browser.newContext();
  contextB = await browser.newContext();
  pageA = await contextA.newPage();
  pageB = await contextB.newPage();

  // Sign both users in up front, so no test depends on another having signed in first.
  await signIn(pageA, userA);
  await pageA.waitForURL("**/dashboard");
  await signIn(pageB, userB);
  await pageB.waitForURL("**/dashboard");
});

test.afterAll(async () => {
  await contextA.close();
  await contextB.close();
  await deleteTestUsers([userA.id, userB.id]);
});

test("protected pages redirect signed-out visitors to sign-in", async ({ page }) => {
  await page.goto("/dashboard/summaries");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard%2Fsummaries/);
});

test("the API refuses unauthenticated requests", async ({ request }) => {
  for (const path of ["/api/summaries", "/api/usage", "/api/preferences"]) {
    expect((await request.get(path)).status(), path).toBe(401);
  }
});

test("a forged session cookie does not grant access", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  await context.addCookies([
    {
      name: "better-auth.session_token",
      value: "forged.value",
      url: baseURL ?? "http://localhost:3000",
    },
  ]);
  const page = await context.newPage();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in/);
  const api = await page.request.get("/api/summaries");
  expect(api.status()).toBe(401);
  await context.close();
});

test("wrong password and unknown email give the same message", async ({ page }) => {
  const attempt = async (email: string, password: string) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    const alert = page.getByRole("alert").filter({ hasText: /\w/ }).first();
    await expect(alert).toBeVisible();
    return (await alert.textContent())?.trim();
  };
  const wrongPassword = await attempt(userA.email, "definitely-wrong-password");
  const unknownEmail = await attempt("nobody-here@example.com", "definitely-wrong-password");
  expect(wrongPassword).toBeTruthy();
  expect(wrongPassword).toBe(unknownEmail);
});

test("sign-in ignores an off-site redirect target", async ({ browser }) => {
  // Fresh context so we start signed out and actually exercise the sign-in flow.
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, userA, "https://evil.example/");
  await page.waitForURL("**/dashboard");
  expect(new URL(page.url()).hostname).toBe("localhost");
  await context.close();
});

test("every app page renders for a signed-in user", async () => {
  // pageB is already signed in from beforeAll.
  const pages: [string, string][] = [
    ["/dashboard", "Welcome back"],
    ["/dashboard/new", "New Distillation"],
    ["/dashboard/summaries", "Archive"],
    ["/dashboard/billing", "Plan & Billing"],
    ["/dashboard/settings", "Settings"],
  ];
  for (const [path, heading] of pages) {
    await pageB.goto(path);
    await expect(
      pageB.getByRole("heading", { level: 1, name: new RegExp(heading) }),
      path,
    ).toBeVisible();
  }
});

test("the free plan locks paid options and validates input before any request", async () => {
  await pageB.goto("/dashboard/new");
  await pageB.getByRole("button", { name: /Deep Dive/ }).click();
  await expect(pageB.getByRole("dialog")).toContainText("paid plans");
  await pageB.keyboard.press("Escape");

  await pageB.getByRole("button", { name: "Distill" }).click();
  await expect(pageB.getByText(/at least 20 words/)).toBeVisible();
});

test("the archive searches, opens, and deletes a summary", async () => {
  // pageA is already signed in from beforeAll.
  await pageA.goto("/dashboard/summaries", { waitUntil: "networkidle" });
  await expect(pageA.getByText("Quarterly harbor report")).toBeVisible();

  await pageA.getByRole("searchbox", { name: "Search the archive" }).fill("coffee");
  await pageA.keyboard.press("Enter");
  await expect(pageA).toHaveURL(/q=coffee/);
  await expect(pageA.getByText("Coffee wholesale notes")).toBeVisible();
  await expect(pageA.getByText("Quarterly harbor report")).toHaveCount(0);

  await pageA.goto("/dashboard/summaries", { waitUntil: "networkidle" });
  const auditLink = pageA.getByRole("link", { name: "Security audit summary" }).first();
  await expect(auditLink).toBeVisible();
  await auditLink.click();
  await expect(pageA).toHaveURL(/\/dashboard\/summaries\/.+/, { timeout: 15_000 });
  await expect(
    pageA.getByRole("heading", { level: 1, name: "Security audit summary" }),
  ).toBeVisible();

  await pageA.getByRole("button", { name: "Delete", exact: true }).first().click();
  await expect(pageA.getByRole("dialog")).toBeVisible();

  // Wait for the success toast — a more reliable signal than the URL, which can lag
  // behind a client-side router.replace.
  await pageA.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
  await expect(pageA.getByText("Summary deleted.")).toBeVisible({ timeout: 10_000 });

  // Confirm the summary is gone by loading the archive fresh.
  await pageA.goto("/dashboard/summaries", { waitUntil: "networkidle" });
  await expect(pageA.getByText("Security audit summary")).toHaveCount(0);
});

test("one user cannot open another user's summary, in the app or the API", async () => {
  const target = summaries.find((s) => s.title === "Quarterly harbor report");
  if (!target) throw new Error("fixture missing");

  // Browser navigation: Next.js streams the dashboard layout before the page can
  // call notFound(), so the HTTP status is 200 even though the not-found page renders.
  // Assert on the content, not the status.
  await pageB.goto(`/dashboard/summaries/${target.id}`);
  await expect(pageB.getByText("could not be found")).toBeVisible({ timeout: 10_000 });
  await expect(
    pageB.getByRole("heading", { level: 1, name: "Quarterly harbor report" }),
  ).toHaveCount(0);

  // The API is a route handler, so it does return a real 404. This is the security proof.
  const api = await pageB.request.get(`/api/summaries/${target.id}`);
  expect(api.status()).toBe(404);

  const patch = await pageB.request.patch(`/api/summaries/${target.id}`, {
    data: { title: "Hijacked" },
  });
  expect(patch.status()).toBe(404);

  const del = await pageB.request.delete(`/api/summaries/${target.id}`);
  expect(del.status()).toBe(404);

  // Alice can still read it — proves nothing was actually changed or deleted.
  const stillThere = await pageA.request.get(`/api/summaries/${target.id}`);
  expect(stillThere.status()).toBe(200);
});

test("signing out ends the session", async () => {
  await pageA.goto("/dashboard", { waitUntil: "networkidle" });
  await pageA.locator("header button[aria-expanded]").click();
  await pageA.getByRole("button", { name: "Sign out" }).click();
  await expect(pageA).toHaveURL("http://localhost:3000/");
  await pageA.goto("/dashboard");
  await expect(pageA).toHaveURL(/\/sign-in/);
});
