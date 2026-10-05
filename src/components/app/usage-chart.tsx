import type { DayBucket } from "@/lib/format";
import { Panel } from "./panel";

export function UsageChart({ days }: { days: DayBucket[] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((sum, d) => sum + d.count, 0);

  return (
    <Panel className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Distillation velocity</h3>
          <p className="text-xs text-muted-foreground">
            {total === 0 ? "No summaries in the last 7 days" : `${total} in the last 7 days`}
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-gold" /> Summaries
        </span>
      </div>
      <div
        className="flex h-44 items-end gap-3 border-b border-border pt-4 pb-2 sm:gap-6"
        role="img"
        aria-label={`Summaries per day: ${days.map((d) => `${d.label} ${d.count}`).join(", ")}`}
      >
        {days.map((day) => (
          <div
            key={day.date.toISOString()}
            className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
          >
            <span className="rounded border border-gold/20 bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-gold-light opacity-0 transition-opacity group-hover:opacity-100">
              {day.count}
            </span>
            <div
              className="w-full max-w-9 rounded-t-lg bg-linear-to-t from-gold/30 to-gold-light transition-all duration-300 group-hover:to-gold group-hover:shadow-[0_0_15px_rgba(200,169,106,0.35)]"
              style={{
                height:
                  day.count === 0 ? "4px" : `${Math.max(12, Math.round((day.count / max) * 100))}%`,
              }}
            />
            <span className="text-[11px] text-muted-foreground group-hover:text-foreground">
              {day.label}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
