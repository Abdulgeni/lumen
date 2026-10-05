"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  side?: "center" | "left";
  children: ReactNode;
};

export function Modal({
  open,
  onClose,
  title,
  description,
  side = "center",
  children,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "bg-transparent p-0 text-foreground backdrop:bg-black/70 backdrop:backdrop-blur-sm",
        side === "center"
          ? "m-auto w-[min(92vw,28rem)]"
          : "m-0 mr-auto h-dvh max-h-dvh w-72 max-w-[85vw]",
      )}
    >
      <div
        className={cn(
          "border border-border bg-card p-6 shadow-2xl",
          side === "center" ? "rounded-3xl" : "h-full rounded-none rounded-r-3xl",
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="font-display text-2xl font-medium text-foreground">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
