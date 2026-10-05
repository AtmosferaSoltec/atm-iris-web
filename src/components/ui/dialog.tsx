"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ReactNode } from "react";
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

/** Modal on Radix Dialog: focus trap, Esc, outside click and scroll lock. */
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
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content
          aria-label={title ? undefined : ariaLabel}
          // Descriptions are optional; Radix warns unless told there is none.
          {...(!description && { "aria-describedby": undefined })}
          className={cn(
            "fixed top-1/2 left-1/2 z-50 flex max-h-[85dvh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-elevated text-ink shadow-menu ring-1 ring-line outline-none data-[state=open]:animate-fade-in",
            widths[size],
          )}
        >
          <header className="flex items-start gap-4 px-6 pt-6 pb-4">
            <div className="min-w-0 flex-1">
              {title ? (
                <DialogPrimitive.Title className="font-serif text-2xl font-medium tracking-tight">
                  {title}
                </DialogPrimitive.Title>
              ) : (
                <DialogPrimitive.Title className="sr-only">{ariaLabel}</DialogPrimitive.Title>
              )}
              {description && (
                <DialogPrimitive.Description asChild>
                  <div className="mt-1.5 text-sm text-ink-2">{description}</div>
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close asChild>
              <IconButton label="Cerrar">
                <X />
              </IconButton>
            </DialogPrimitive.Close>
          </header>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2">{children}</div>}
          {footer && (
            <footer className="flex flex-wrap items-center justify-end gap-3 px-6 pt-4 pb-6">
              {footer}
            </footer>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
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
  /** Shown inside the dialog when the confirmed action fails. */
  error?: string;
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
  error,
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
    >
      {error && (
        <p role="alert" className="pb-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </Dialog>
  );
}
