import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

export const MAX_EXTRACTED_CHARS = 1_000_000;

export type ExtractedArticle = { title: string | null; text: string };

export function normalizeText(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\f\v\u00a0]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Pulls readable text from HTML. No scripts are executed: linkedom is a static parser. */
export function extractArticle(html: string): ExtractedArticle {
  const { document } = parseHTML(html);
  const pageTitle = document.title?.trim() || null;

  try {
    // Readability mutates the DOM it is given, so it gets its own copy.
    const copy = parseHTML(html).document;
    const article = new Readability(copy as unknown as Document).parse();
    const text = normalizeText(article?.textContent ?? "");
    if (text.length >= 200) {
      return {
        title: article?.title?.trim() || pageTitle,
        text: text.slice(0, MAX_EXTRACTED_CHARS),
      };
    }
  } catch {
    /* fall through to the plain-text fallback */
  }

  for (const element of document.querySelectorAll(
    "script, style, noscript, template, svg, iframe, nav, footer, header, aside, form",
  )) {
    element.remove();
  }
  const text = normalizeText(
    document.body?.textContent ?? document.documentElement?.textContent ?? "",
  );
  return { title: pageTitle, text: text.slice(0, MAX_EXTRACTED_CHARS) };
}
