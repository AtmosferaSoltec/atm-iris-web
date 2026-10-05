"use client";

import { CircleAlert, CircleCheck, RotateCw, X } from "lucide-react";
import { Button, IconButton } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { fileSize, percent } from "@/lib/format";
import { KIND_COLORS, KIND_ICONS } from "../media-format";
import type { UploadItem } from "../upload/use-media-upload";

const STATUS_TEXT: Record<UploadItem["status"], string> = {
  measuring: "Leyendo el archivo…",
  requesting: "Preparando…",
  uploading: "Subiendo",
  confirming: "Guardando…",
  done: "Listo",
  error: "",
};

type Props = {
  items: UploadItem[];
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onDismiss: (id: string) => void;
  onClearFinished: () => void;
};

export function UploadQueue({ items, onCancel, onRetry, onDismiss, onClearFinished }: Props) {
  if (items.length === 0) return null;
  const hasFinished = items.some((item) => item.status === "done" || item.status === "error");

  return (
    <Surface role="region" aria-label="Subidas" className="flex flex-col gap-1 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 pb-2">
        <h2 className="eyebrow text-ink-2">Subidas</h2>
        {hasFinished && (
          <Button variant="ghost" size="sm" onClick={onClearFinished}>
            Limpiar terminadas
          </Button>
        )}
      </div>
      <ul className="flex flex-col divide-y divide-line">
        {items.map((item) => {
          const Icon = item.kind ? KIND_ICONS[item.kind] : CircleAlert;
          const color = item.kind ? KIND_COLORS[item.kind] : "var(--color-ink-3)";
          const isActive = item.status !== "done" && item.status !== "error";
          return (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <span
                className="grid size-9 shrink-0 place-items-center rounded-sm"
                style={{ color, backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
              >
                <Icon aria-hidden className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline gap-2">
                  <span className="truncate text-sm font-semibold">{item.title}</span>
                  <span className="shrink-0 text-xs text-ink-2">{fileSize(item.sizeBytes)}</span>
                </p>
                {item.status === "error" ? (
                  <p role="alert" className="text-xs font-medium text-danger">
                    {item.error}
                    {item.canRetry && " Reintenta."}
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 text-xs text-ink-2">
                    {item.status === "done" && (
                      <CircleCheck aria-hidden className="size-3.5 text-success" />
                    )}
                    {STATUS_TEXT[item.status]}
                    {item.status === "uploading" && ` ${percent(item.progress)}`}
                  </p>
                )}
                {isActive && (
                  <div
                    role="progressbar"
                    aria-label={`Progreso de ${item.title}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(item.progress * 100)}
                    className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-raised"
                  >
                    <div
                      className={cn(
                        "h-full rounded-full bg-accent transition-[width]",
                        item.status !== "uploading" &&
                          item.status !== "confirming" &&
                          "animate-pulse",
                      )}
                      style={{ width: `${Math.max(item.progress * 100, 4)}%` }}
                    />
                  </div>
                )}
              </div>
              {item.status === "error" && item.canRetry && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RotateCw className="size-3.5" />}
                  onClick={() => onRetry(item.id)}
                >
                  Reintentar
                </Button>
              )}
              {item.status === "uploading" ? (
                <IconButton label={`Cancelar ${item.title}`} onClick={() => onCancel(item.id)}>
                  <X />
                </IconButton>
              ) : (
                !isActive && (
                  <IconButton
                    label={`Quitar ${item.title} de la lista`}
                    onClick={() => onDismiss(item.id)}
                  >
                    <X />
                  </IconButton>
                )
              )}
            </li>
          );
        })}
      </ul>
    </Surface>
  );
}
