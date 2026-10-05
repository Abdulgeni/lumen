import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Panel({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-card/80 shadow-lg backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}
