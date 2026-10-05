import { ArrowRight, Calendar, Star } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { compressionPercent, formatDate } from "@/lib/format";
import { summaryHref } from "@/lib/routes";
import { MODE_LABELS } from "@/lib/summary-options";
import type { SummaryListItem } from "@/server/summaries";
import { Panel } from "./panel";

export function SummaryCard({ summary }: { summary: SummaryListItem }) {
  const condensed = compressionPercent(summary.inputWords, summary.outputWords);
  return (
    <Panel className="group flex flex-col justify-between p-6 transition-all duration-300 hover:border-gold/40">
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{MODE_LABELS[summary.mode]}</Badge>
            {summary.isFavorite ? (
              <Star className="size-3.5 fill-gold text-gold" aria-label="Favorite" />
            ) : null}
          </div>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="size-3" /> {formatDate(summary.createdAt)}
          </span>
        </div>
        <Link href={summaryHref(summary.id)}>
          <h3 className="mb-2 line-clamp-2 font-display text-xl font-semibold transition-colors group-hover:text-gold-light">
            {summary.title}
          </h3>
        </Link>
        <p className="mb-4 line-clamp-3 text-sm leading-relaxed font-light text-muted-foreground">
          {summary.preview ?? ""}
        </p>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <span>
          {condensed !== null ? (
            <span className="font-medium text-gold">{condensed}% condensed · </span>
          ) : null}
          {summary.outputWords > 0
            ? `${summary.outputWords.toLocaleString("en-US")} words`
            : summary.sourceType.toLowerCase()}
        </span>
        <Link
          href={summaryHref(summary.id)}
          className="flex items-center gap-1 font-medium text-gold-light hover:text-gold"
        >
          Open <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </Panel>
  );
}
