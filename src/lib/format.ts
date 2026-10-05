const DAY_MS = 86_400_000;

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" });
}

export function compressionPercent(inputWords: number, outputWords: number): number | null {
  if (inputWords <= 0 || outputWords <= 0) return null;
  return Math.min(99, Math.max(0, Math.round((1 - outputWords / inputWords) * 100)));
}

export function hoursSaved(wordsNotRead: number): number {
  return Math.round((Math.max(0, wordsNotRead) / 220 / 60) * 10) / 10;
}

export type DayBucket = { date: Date; label: string; count: number; words: number };

export function bucketByDay(
  rows: { createdAt: Date; inputWords: number }[],
  days: number,
  now: Date = new Date(),
): DayBucket[] {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const first = today - (days - 1) * DAY_MS;
  const buckets: DayBucket[] = Array.from({ length: days }, (_, i) => {
    const date = new Date(first + i * DAY_MS);
    return {
      date,
      label: date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      count: 0,
      words: 0,
    };
  });
  for (const row of rows) {
    const day = Date.UTC(
      row.createdAt.getUTCFullYear(),
      row.createdAt.getUTCMonth(),
      row.createdAt.getUTCDate(),
    );
    const bucket = buckets[Math.round((day - first) / DAY_MS)];
    if (bucket) {
      bucket.count += 1;
      bucket.words += row.inputWords;
    }
  }
  return buckets;
}

export function pageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  pages.forEach((page, index) => {
    const previous = pages[index - 1];
    if (previous !== undefined && page - previous > 1) out.push("ellipsis");
    out.push(page);
  });
  return out;
}

export function buildHref(path: string, params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}
