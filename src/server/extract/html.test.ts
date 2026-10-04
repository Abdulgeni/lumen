import { describe, expect, it } from "vitest";
import { extractArticle } from "./html";

const paragraph =
  "The harbor commission approved a new ferry schedule on Tuesday after months of public hearings. ".repeat(
    8,
  );

describe("extractArticle", () => {
  it("extracts the article and drops scripts, navigation and footers", () => {
    const html = `<html><head><title>Ferry plan approved</title><script>window.secret = "tracking-token";</script></head>
      <body><nav>Home About Contact</nav><article><h1>Ferry plan approved</h1><p>${paragraph}</p><p>${paragraph}</p></article>
      <footer>Copyright notice</footer></body></html>`;
    const { title, text } = extractArticle(html);
    expect(title).toContain("Ferry plan approved");
    expect(text).toContain("ferry schedule");
    expect(text).not.toContain("tracking-token");
    expect(text).not.toContain("Copyright notice");
  });

  it("falls back to body text for short pages", () => {
    const html =
      "<html><head><title>Hi</title></head><body><script>bad()</script><p>Short page body text.</p></body></html>";
    expect(extractArticle(html)).toEqual({ title: "Hi", text: "Short page body text." });
  });
});
