import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownView } from "@/components/app/markdown-view";
import { Panel } from "@/components/app/panel";
import { SummaryActions } from "@/components/app/summary-actions";
import { Badge } from "@/components/ui/badge";
import { compressionPercent, formatDate } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { languageName, MODE_LABELS } from "@/lib/summary-options";
import { idSchema } from "@/lib/validation/summary";
import { requireSession } from "@/server/session";
import { getSummary } from "@/server/summaries";

export const metadata: Metadata = { title: "Summary", robots: { index: false } };

const lower = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

export default async function SummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireSession();
  const parsedId = idSchema.safeParse((await params).id);
  if (!parsedId.success) notFound();

  const summary = await getSummary(user.id, parsedId.data);
  if (!summary || !summary.resultMarkdown) notFound();

  const condensed = compressionPercent(summary.inputWords, summary.outputWords);
  const safeUrl =
    summary.sourceUrl && /^https?:\/\//i.test(summary.sourceUrl) ? summary.sourceUrl : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={ROUTES.archive}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Archive
      </Link>

      <header className="space-y-4 border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="gold">{MODE_LABELS[summary.mode]}</Badge>
          <Badge variant="outline">{lower(summary.length)}</Badge>
          <Badge variant="outline">{lower(summary.tone)}</Badge>
          <Badge variant="outline">{languageName(summary.outputLanguage)}</Badge>
        </div>
        <h1 className="font-display text-4xl leading-tight font-light">{summary.title}</h1>
        <p className="text-sm text-muted-foreground">
          {formatDate(summary.createdAt)}
          {summary.inputWords > 0
            ? ` · ${summary.inputWords.toLocaleString("en-US")} → ${summary.outputWords} words`
            : ""}
          {condensed !== null ? <span className="text-gold"> · {condensed}% condensed</span> : null}
        </p>
        {safeUrl ? (
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1.5 text-sm text-gold hover:text-gold-light"
          >
            <ExternalLink className="size-3.5" /> {summary.sourceName ?? "Original source"}
          </a>
        ) : summary.sourceName ? (
          <p className="text-sm text-muted-foreground">Source file: {summary.sourceName}</p>
        ) : null}
        <SummaryActions
          id={summary.id}
          title={summary.title}
          isFavorite={summary.isFavorite}
          markdown={summary.resultMarkdown}
        />
      </header>

      <Panel className="p-6 sm:p-10">
        <MarkdownView content={summary.resultMarkdown} />
      </Panel>
    </div>
  );
}
