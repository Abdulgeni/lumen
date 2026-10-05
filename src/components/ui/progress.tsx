import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  label,
}: {
  value: number;
  className?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-secondary", className)}
    >
      <div
        className="h-full rounded-full bg-linear-to-r from-gold to-gold-light transition-[width] duration-700 ease-weighted"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
