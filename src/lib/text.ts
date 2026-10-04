/** Plain-text snippet of a Markdown summary, for history lists. */
export function makePreview(markdown: string, max = 240): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-+*]\s+/gm, "")
    .replace(/[*_`>~|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > max ? `${plain.slice(0, max - 1).trimEnd()}…` : plain;
}

/** Title to use if the model returns none: a hint (page title, file name) or the first words. */
export function fallbackTitle(hint: string | null | undefined, text: string): string {
  const base = (hint?.trim() || text.trim().split(/\s+/).slice(0, 10).join(" ")).trim();
  if (!base) return "Untitled summary";
  return base.length > 70 ? `${base.slice(0, 69).trimEnd()}…` : base;
}

/**
 * Escapes LIKE wildcards. Prisma's `contains` passes % and _ straight through, and
 * PostgreSQL's default LIKE escape character is a backslash.
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}
