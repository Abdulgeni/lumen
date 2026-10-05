import { CirclePlus, FileText, Search, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/app/pagination";
import { Panel } from "@/components/app/panel";
import { SummaryCard } from "@/components/app/summary-card";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildHref } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { listQuerySchema } from "@/lib/validation/summary";
import { requireSession } from "@/server/session";
import { listSummaries } from "@/server/summaries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Archive", robots: { index: false } };

const PAGE_SIZE = "8";
const MODE_FILTERS = [
  { label: "All", value: undefined },
  { label: "Briefs", value: "EXECUTIVE_BRIEF" },
  { label: "Key Points", value: "KEY_POINTS" },
  { label: "Deep Dives", value: "DEEP_DIVE" },
] as const;

const chip = "whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-medium transition-colors";

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireSession();
  const raw = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );
  const parsed = listQuerySchema.safeParse({ ...flat, pageSize: PAGE_SIZE });
  const query = parsed.success ? parsed.data : listQuerySchema.parse({ pageSize: PAGE_SIZE });

  const result = await listSummaries(user.id, query);
  const filters = {
    q: query.q,
    mode: query.mode,
    favorite: query.favorite === "true" ? "true" : undefined,
  };
  const isFiltered = Boolean(query.q || query.mode || filters.favorite);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-4xl font-light tracking-tight">Archive</h1>
          <p className="text-sm text-muted-foreground">
            {result.total} {result.total === 1 ? "summary" : "summaries"}
            {isFiltered ? " match your filters" : " saved"}
          </p>
        </div>
        <Link href={ROUTES.newSummary} className={buttonVariants()}>
          <CirclePlus className="size-4" /> New Distillation
        </Link>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <form method="get" role="search" className="relative w-full flex-1">
          <label htmlFor="archive-search" className="sr-only">
            Search the archive
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="archive-search"
            name="q"
            type="search"
            defaultValue={query.q ?? ""}
            maxLength={100}
            placeholder="Search titles and content"
            className="pl-10"
          />
          {query.mode ? <input type="hidden" name="mode" value={query.mode} /> : null}
          {filters.favorite ? <input type="hidden" name="favorite" value="true" /> : null}
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {MODE_FILTERS.map((filter) => {
            const active = query.mode === filter.value;
            return (
              <Link
                key={filter.label}
                href={buildHref(ROUTES.archive, { ...filters, mode: filter.value })}
                aria-current={active ? "true" : undefined}
                className={cn(
                  chip,
                  active
                    ? "border-gold bg-gold/20 text-gold-light"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {filter.label}
              </Link>
            );
          })}
          <Link
            href={buildHref(ROUTES.archive, {
              ...filters,
              favorite: filters.favorite ? undefined : "true",
            })}
            aria-pressed={Boolean(filters.favorite)}
            className={cn(
              chip,
              "flex items-center gap-1.5",
              filters.favorite
                ? "border-gold bg-gold/20 text-gold-light"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <Star className={cn("size-3.5", filters.favorite && "fill-gold text-gold")} /> Favorites
          </Link>
        </div>
      </div>

      {result.items.length === 0 ? (
        <Panel className="p-16 text-center">
          <FileText className="mx-auto mb-3 size-10 text-gold/40" />
          <h3 className="mb-1 text-base font-semibold">
            {isFiltered ? "Nothing matches" : "Your archive is empty"}
          </h3>
          <p className="mx-auto mb-6 max-w-sm text-sm text-muted-foreground">
            {isFiltered
              ? "Try different words or clear the filters."
              : "Summaries you create are saved here."}
          </p>
          <Link
            href={isFiltered ? ROUTES.archive : ROUTES.newSummary}
            className={buttonVariants({ size: "sm" })}
          >
            {isFiltered ? "Clear filters" : "Create a summary"}
          </Link>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {result.items.map((summary) => (
            <SummaryCard key={summary.id} summary={summary} />
          ))}
        </div>
      )}

      <Pagination
        path={ROUTES.archive}
        params={filters}
        page={result.page}
        totalPages={result.totalPages}
      />
    </div>
  );
}
