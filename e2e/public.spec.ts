import { expect, test } from "@playwright/test";
import { PLAN_PRICE_USD } from "../src/lib/billing";

const PAGES: [string, RegExp][] = [
  ["/", /Lumen/],
  ["/features", /Features/],
  ["/how-it-works", /How it works/],
  ["/showcase", /Showcase/],
  ["/pricing", /Pricing/],
  ["/faq", /FAQ/],
  ["/privacy", /Privacy/],
  ["/terms", /Terms/],
];

for (const [path, title] of PAGES) {
  test(`${path} renders with one h1 and a title`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(title);
    await expect(page.locator("h1")).toHaveCount(1);
  });
}

test("pricing shows the configured prices", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByText(`$${PLAN_PRICE_USD.pro}`, { exact: true })).toBeVisible();
  await expect(page.getByText(`$${PLAN_PRICE_USD.team}`, { exact: true })).toBeVisible();
});

test("security headers are set", async ({ request }) => {
  const headers = (await request.get("/")).headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["content-security-policy"]).toContain("object-src 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["strict-transport-security"]).toContain("max-age");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("robots, sitemap and security.txt are served", async ({ request }) => {
  expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /dashboard");
  expect(await (await request.get("/sitemap.xml")).text()).toContain("/pricing");
  expect(await (await request.get("/.well-known/security.txt")).text()).toContain(
    "Contact: mailto:",
  );
});

test("unknown pages show the branded 404", async ({ page }) => {
  const response = await page.goto("/definitely-not-a-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("could not be found")).toBeVisible();
});
