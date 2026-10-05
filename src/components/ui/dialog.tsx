"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button, IconButton } from "./button";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  /** Omit for dialogs that draw their own heading; then pass `ariaLabel`. */
  title?: string;
  ariaLabel?: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
};

const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl" };

/** Modal on the native <dialog> element: focus trap, Esc and backdrop come from the browser. */
export function Dialog({
  open,
  onClose,
  title,
  ariaLabel,
  description,
  children,
  footer,
  size = "md",
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : ariaLabel}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      className={cn(
        "m-auto w-[calc(100%-2rem)] rounded-2xl bg-elevated p-0 text-ink ring-1 ring-line backdrop:bg-black/60 backdrop:backdrop-blur-sm open:animate-fade-in",
        widths[size],
      )}
    >
      {open && (
        <div className="flex max-h-[85dvh] flex-col">
          <header className="flex items-start gap-4 px-6 pt-6 pb-4">
            <div className="min-w-0 flex-1">
              {title && (
                <h2 id={titleId} className="font-serif text-2xl font-medium tracking-tight">
                  {title}
                </h2>
              )}
              {description && <div className="mt-1.5 text-sm text-ink-2">{description}</div>}
            </div>
            <IconButton label="Cerrar" onClick={onClose}>
              <X />
            </IconButton>
          </header>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2">{children}</div>}
          {footer && (
            <footer className="flex flex-wrap items-center justify-end gap-3 px-6 pt-4 pb-6">
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  isPending?: boolean;
};

/** Destructive confirmation ("¿Eliminar…?"). */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  isPending,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isPending}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
