"use client";

import { Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import { toast } from "@/components/ui/toaster";
import { MEDIA_RULES } from "@/domain/media-rules";
import { useMediaUpload } from "@/features/media/upload/use-media-upload";
import { titleFromFileName } from "@/lib/text";
import { cn } from "@/lib/cn";
import type { LiveConsole } from "../use-live-console";
import { DEFAULT_SOUND_ICON, soundEntry, SOUND_ICONS } from "./sound-icons";

/** "Agregar sonido": an audio file, a name and an icon. It joins the list once uploaded. */
export function AddSoundDialog({
  ctrl,
  onClose,
}: {
  ctrl: Pick<LiveConsole, "addSound">;
  onClose: () => void;
}) {
  const picker = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState(DEFAULT_SOUND_ICON);

  const upload = useMediaUpload({
    section: "sounds",
    onUploaded: (asset) => {
      ctrl.addSound(soundEntry(asset));
      toast.success(`Sonido «${asset.title}» listo`);
    },
  });
  const current = upload.items[0];
  const isUploading = upload.isBusy;

  // The uploader handles one file at a time here; closing waits for it to land.
  function choose(picked: File | undefined) {
    if (!picked) return;
    setFile(picked);
    setTitle((now) => now || titleFromFileName(picked.name) || picked.name);
  }

  function save() {
    if (!file || !title.trim()) return;
    upload.addFiles([file], { title, soundIcon: icon });
  }

  // Done: close. Failed: stay, showing why, so the file can be changed or tried again.
  const isDone = current?.status === "done";
  useEffect(() => {
    if (isDone) onClose();
  }, [isDone, onClose]);

  return (
    <Dialog
      open
      onClose={isUploading ? () => {} : onClose}
      size="md"
      title="Agregar sonido"
      description="Un audio corto (aplausos, tambor, risas…) que podrás reproducir con un clic."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isUploading}>
            Cancelar
          </Button>
          <Button onClick={save} isLoading={isUploading} disabled={!file || !title.trim()}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 pb-4">
        <div>
          <input
            ref={picker}
            type="file"
            accept={MEDIA_RULES.audio.contentTypes.join(",")}
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              choose(event.target.files?.[0]);
              upload.clearFinished();
              event.target.value = "";
            }}
          />
          <Button
            variant="secondary"
            icon={<Upload className="size-4" />}
            onClick={() => picker.current?.click()}
            disabled={isUploading}
          >
            {file ? "Cambiar archivo" : "Elegir archivo de audio"}
          </Button>
          {file && <p className="mt-2 truncate text-xs text-ink-2">{file.name}</p>}
          {current?.status === "error" && (
            <p role="alert" className="mt-2 text-sm font-medium text-danger">
              {current.error}
            </p>
          )}
        </div>

        <TextField
          id="sound-title"
          label="Nombre"
          placeholder="Aplausos"
          maxLength={120}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Icono</legend>
          <div className="grid grid-cols-7 gap-2">
            {Object.entries(SOUND_ICONS).map(([key, { icon: Icon, label }]) => (
              <button
                key={key}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={icon === key}
                onClick={() => setIcon(key)}
                className={cn(
                  "grid aspect-square cursor-pointer place-items-center rounded-sm ring-1 transition ring-inset",
                  icon === key
                    ? "bg-surface-raised text-ink ring-line-strong"
                    : "text-ink-2 ring-line hover:bg-surface hover:text-ink",
                )}
              >
                <Icon aria-hidden className="size-[18px]" />
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </Dialog>
  );
}
