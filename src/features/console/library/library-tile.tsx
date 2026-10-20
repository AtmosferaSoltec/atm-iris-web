"use client";

import { useDraggable } from "@dnd-kit/core";
import { Check, Ellipsis, Pencil, Trash2 } from "lucide-react";
import { memo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { dragListener, type LibraryDragData } from "../dnd";
import type { LibraryEntry } from "../model";
import { ENTRY_ICONS } from "./entry-icons";

type Props = {
  entry: LibraryEntry;
  isAdded: boolean;
  isAdding: boolean;
  onAdd: (entry: LibraryEntry) => void;
  /** Double click: straight to the screens. */
  onShow: (entry: LibraryEntry) => void;
  onEdit: (entry: LibraryEntry) => void;
  onDelete: (entry: LibraryEntry) => void;
};

/**
 * An image, video or YouTube link as a picture in the Multimedia grid, no text: dragged to the
 * service like a row; double click puts it on the screens. A video shows its first frame.
 */
export const LibraryTile = memo(function LibraryTile({
  entry,
  isAdded,
  isAdding,
  onAdd,
  onShow,
  onEdit,
  onDelete,
}: Props) {
  const { icon: Icon, color } = ENTRY_ICONS[entry.icon];
  const data: LibraryDragData = { type: "library", entry };
  const { setNodeRef, listeners, isDragging } = useDraggable({
    id: `library:${entry.id}`,
    data,
    disabled: isAdded,
  });
  return (
    <div
      ref={setNodeRef}
      {...dragListener(listeners, "onPointerDown")}
      onDoubleClick={() => onShow(entry)}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-md bg-surface ring-1 ring-line",
        !isAdded && "cursor-grab",
        isDragging && "opacity-40",
      )}
      title={`${entry.title}: doble clic para mostrarlo en pantalla${isAdded ? " (ya está en el servicio)" : ", o arrástralo al servicio"}`}
    >
      {entry.previewUrl ? (
        entry.icon === "video" ? (
          // The first frame: metadata only, a hair in so it isn't black.
          <video
            src={`${entry.previewUrl}#t=0.1`}
            preload="metadata"
            muted
            playsInline
            aria-label={entry.title}
            className="pointer-events-none size-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- signed URLs expire in 1 h; next/image would cache them
          <img
            src={entry.previewUrl}
            alt={entry.title}
            draggable={false}
            className="pointer-events-none size-full object-cover"
          />
        )
      ) : (
        <span className="grid size-full place-items-center">
          <Icon aria-hidden className="size-6" style={{ color }} />
        </span>
      )}
      {entry.icon !== "image" && (
        <Icon
          aria-hidden
          className="absolute bottom-1 left-1 size-4 drop-shadow"
          style={{ color: "white" }}
        />
      )}
      {isAdded && (
        <span className="absolute inset-0 grid place-items-center bg-black/50">
          <Check aria-label="En el servicio" className="size-5 text-white" />
        </span>
      )}
      {isAdding && (
        <span
          role="status"
          aria-label="Agregando"
          className="absolute inset-0 grid place-items-center bg-black/50"
        >
          <Spinner className="size-5 text-white" />
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Opciones de «${entry.title}»`}
            className="absolute top-1 right-1 grid size-6 cursor-pointer place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
          >
            <Ellipsis className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {entry.kind !== "youtube" && (
            <DropdownMenuItem onSelect={() => onEdit(entry)}>
              <Pencil />
              Ver y editar
            </DropdownMenuItem>
          )}
          <DropdownMenuItem tone="danger" onSelect={() => onDelete(entry)}>
            <Trash2 />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {!isAdded && !isAdding && (
        <button
          type="button"
          onClick={() => onAdd(entry)}
          aria-label={`Agregar «${entry.title}» al servicio`}
          className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:right-1 focus-visible:bottom-1 focus-visible:rounded-full focus-visible:bg-black/70 focus-visible:px-2 focus-visible:py-0.5 focus-visible:text-xs focus-visible:text-white"
        >
          Agregar
        </button>
      )}
    </div>
  );
});
