import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-56 w-full resize-y rounded-xl border border-foreground/10 bg-secondary/70 px-4 py-3 text-base leading-relaxed text-foreground shadow-inner outline-none placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/50 disabled:opacity-50 sm:text-sm",
        className,
      )}
      {...props}
    />
  );
}
