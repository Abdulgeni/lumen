import { MARK_PATHS, MARK_VIEWBOX } from "@/lib/brand";
import { APP_NAME } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function LogoMark({
  className,
  strokeWidth = 1.5,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  const line = { fill: "none", vectorEffect: "non-scaling-stroke", strokeWidth } as const;
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      aria-hidden="true"
      className={cn("text-gold", className)}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={MARK_PATHS.upperFill} fill="currentColor" fillOpacity={0.07} />
      <path d={MARK_PATHS.outerUpper} stroke="currentColor" strokeOpacity={0.95} {...line} />
      <path d={MARK_PATHS.outerLower} stroke="currentColor" strokeOpacity={0.5} {...line} />
      <path d={MARK_PATHS.equator} stroke="currentColor" strokeOpacity={0.45} {...line} />
      <path d={MARK_PATHS.innerUpper} stroke="currentColor" strokeOpacity={0.6} {...line} />
      <path d={MARK_PATHS.innerLower} stroke="currentColor" strokeOpacity={0.4} {...line} />
    </svg>
  );
}

/** The mark beside the spaced wordmark. */
export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark className={cn("h-7 w-auto", markClassName)} />
      <span className="gold-shimmer font-display text-2xl font-medium tracking-[0.3em] uppercase">
        {APP_NAME}
      </span>
    </span>
  );
}
