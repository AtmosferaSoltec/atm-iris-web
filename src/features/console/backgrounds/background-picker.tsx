"use client";

import { ImagePlay, Plus } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toaster";
import { BACKGROUND_TYPES } from "@/domain/media-rules";
import { deleteMedia } from "@/features/media/actions";
import { useMediaUpload } from "@/features/media/upload/use-media-upload";
import type { ProjectionBackground } from "@/features/projection/model";
import type { LiveConsole } from "../use-live-console";
import { backgroundFor } from "./actions";
import { BackgroundSwatch } from "./background-swatch";

/**
 * FONDOS (IRIS_SPEC §6.5): black (no background) and the church's own, and the card that
 * adds a new one. There are none by default: the lyrics show on black.
 */
export function BackgroundPicker({ ctrl }: { ctrl: LiveConsole }) {
  const picker = useRef<HTMLInputElement>(null);
  const [deleting, setDeleting] = useState<ProjectionBackground | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const { addBackground, removeBackground } = ctrl;
  // Out of the popover: an upload keeps going (and lands) after it closes.
  const upload = useMediaUpload({
    section: "backgrounds",
    onUploaded: async (asset) => {
      const result = await backgroundFor(asset.id);
      if (!result.background) return result.error ?? "No pudimos mostrar el fondo.";
      addBackground(result.background);
      toast.success(`Fondo «${asset.title}» listo`);
    },
  });
  const uploading = upload.items.filter(
    (item) => item.status !== "done" && item.status !== "error",
  );
  const failed = upload.items.filter((item) => item.status === "error");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Cambiar el fondo de la pantalla"
          className="flex h-10 cursor-pointer items-center gap-2.5 rounded-full px-4 text-sm font-medium text-ink ring-1 ring-line transition ring-inset hover:bg-surface data-[state=open]:bg-surface"
        >
          <ImagePlay aria-hidden className="size-4 text-rose" />
          Fondo
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[420px]">
        <h3 className="mb-3 eyebrow text-ink-2">Fondos</h3>
        <div className="grid max-h-[60vh] grid-cols-3 gap-3 overflow-y-auto p-0.5">
          <BackgroundSwatch
            name="Negro"
            isSelected={ctrl.backgroundId === null}
            onSelect={() => ctrl.setBackgroundId(null)}
          />
          {ctrl.backgrounds.map((background) => (
            <BackgroundSwatch
              key={background.id}
              name={background.name}
              background={background}
              isSelected={ctrl.backgroundId === background.id}
              state={ctrl.fileState(background.id)}
              onSelect={() => ctrl.setBackgroundId(background.id)}
              onDelete={() => setDeleting(background)}
            />
          ))}
          {uploading.map((item) => (
            <div key={item.id} className="flex flex-col gap-1.5">
              <span className="grid aspect-video place-items-center rounded-sm ring-1 ring-line">
                <Spinner className="size-4 text-ink-2" />
              </span>
              <span className="truncate text-xs text-ink-2">{item.title}</span>
            </div>
          ))}
          <button
            type="button"
            onClick={() => picker.current?.click()}
            className="flex cursor-pointer flex-col gap-1.5 text-left"
          >
            <span className="grid aspect-video place-items-center rounded-sm border border-dashed border-line-strong text-ink-2 transition hover:border-coral hover:text-ink">
              <Plus className="size-5" />
            </span>
            <span className="truncate text-xs text-ink-2">Agregar fondo</span>
          </button>
        </div>
        {failed.map((item) => (
          <p key={item.id} role="alert" className="mt-3 text-xs font-medium text-danger">
            {item.title}: {item.error}
          </p>
        ))}
        <input
          ref={picker}
          type="file"
          multiple
          accept={BACKGROUND_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => {
            if (event.target.files) upload.addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </PopoverContent>
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        isPending={isDeleting}
        title={`¿Eliminar el fondo «${deleting?.name}»?`}
        description="Se borra el archivo. No se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={() =>
          startDelete(async () => {
            if (!deleting) return;
            const result = await deleteMedia(deleting.id);
            if (result.error) toast.error(result.error);
            else removeBackground(deleting.id);
            setDeleting(null);
          })
        }
      />
    </Popover>
  );
}
