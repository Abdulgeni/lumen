import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-linear-to-r from-gold via-gold-light to-gold text-obsidian font-semibold shadow-[0_0_25px_rgba(200,169,106,0.25)] hover:shadow-[0_0_35px_rgba(200,169,106,0.4)] hover:brightness-105",
        gold: "bg-gold text-obsidian font-semibold shadow-md hover:bg-gold-light",
        outline:
          "border border-foreground/10 bg-transparent text-foreground hover:border-primary/40 hover:bg-foreground/5",
        secondary:
          "border border-foreground/8 bg-secondary text-secondary-foreground hover:border-foreground/15 hover:bg-surface-hover",
        ghost: "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        destructive: "border border-red-800/40 bg-red-950/80 text-red-200 hover:bg-red-900",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-12 rounded-xl px-7 text-base font-semibold",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type ButtonProps = Omit<ButtonPrimitive.Props, "className"> &
  VariantProps<typeof buttonVariants> & { className?: string };

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants, type ButtonProps };
