"use client";

import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string; locked?: boolean };

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  onLocked,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  onLocked?: (value: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </p>
      <div
        role="radiogroup"
        aria-label={label}
        className="grid auto-cols-fr grid-flow-col gap-1.5 rounded-xl border border-border bg-secondary/40 p-1"
      >
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => (option.locked ? onLocked?.(option.value) : onChange(option.value))}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                selected
                  ? "bg-gold/20 text-gold-light shadow-[0_0_12px_rgba(200,169,106,0.15)]"
                  : "text-muted-foreground hover:text-foreground",
                option.locked && "opacity-70",
              )}
            >
              {option.label}
              {option.locked ? <Lock className="size-3" aria-label="Paid plans only" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-11 w-full rounded-xl border border-foreground/10 bg-secondary/70 px-3 text-base text-foreground outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/50 sm:text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
