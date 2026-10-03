import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "border-primary/30 bg-primary/15 text-accent-foreground",
        gold: "border-primary/40 bg-linear-to-r from-primary/20 to-gold-light/20 text-accent-foreground shadow-[0_0_15px_rgba(200,169,106,0.15)]",
        secondary: "border-foreground/8 bg-secondary text-muted-foreground",
        outline: "border-foreground/15 text-foreground",
        emerald:
          "border-emerald-500/30 bg-emerald-950/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]",
        destructive: "border-red-800/40 bg-red-950/60 text-red-300",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
