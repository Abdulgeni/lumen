import type { ReactNode } from "react";
import { Input, type InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FieldProps = Omit<InputProps, "id"> & {
  id: string;
  label: string;
  error?: string | undefined;
  labelAside?: ReactNode;
};

export function Field({ id, label, error, labelAside, ...props }: FieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id}>{label}</Label>
        {labelAside}
      </div>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
