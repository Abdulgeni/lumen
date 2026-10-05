import Link from "next/link";
import { buildHref, pageWindow } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  path: string;
  params: Record<string, string | undefined>;
  page: number;
  totalPages: number;
};

export function Pagination({ path, params, page, totalPages }: Props) {
  if (totalPages <= 1) return null;
  const href = (p: number) => buildHref(path, { ...params, page: p > 1 ? String(p) : undefined });
  const base =
    "flex size-9 items-center justify-center rounded-xl border text-xs font-semibold transition-colors";

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2 pt-6">
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          className={cn(
            base,
            "w-auto border-border bg-card px-3 text-muted-foreground hover:text-foreground",
          )}
        >
          Previous
        </Link>
      ) : null}
      {pageWindow(page, totalPages).map((entry, index) =>
        entry === "ellipsis" ? (
          <span key={`gap-${index}`} className="px-1 text-muted-foreground" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={href(entry)}
            aria-current={entry === page ? "page" : undefined}
            className={cn(
              base,
              entry === page
                ? "border-gold bg-gold text-obsidian"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {entry}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link
          href={href(page + 1)}
          className={cn(
            base,
            "w-auto border-border bg-card px-3 text-muted-foreground hover:text-foreground",
          )}
        >
          Next
        </Link>
      ) : null}
    </nav>
  );
}
