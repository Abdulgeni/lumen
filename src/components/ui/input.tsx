import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@/lib/utils";

type InputProps = Omit<InputPrimitive.Props, "className"> & { className?: string };

function Input({ className, type, ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-xl border border-foreground/10 bg-secondary/70 px-4 py-2 text-base text-foreground shadow-inner transition-all duration-200 outline-none placeholder:text-muted-foreground/50 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-500/60 aria-invalid:ring-red-500/30 sm:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input, type InputProps };
