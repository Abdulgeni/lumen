import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.use({ reducedMotion: "reduce" });

for (const path of [
  "/",
  "/features",
  "/how-it-works",
  "/showcase",
  "/pricing",
  "/faq",
  "/sign-in",
  "/sign-up",
  "/privacy",
  "/terms",
]) {
  test(`${path} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious.map((v) => `${v.id}: ${v.nodes.length} element(s)`)).toEqual([]);
  });
}
