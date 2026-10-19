"use client";

import { Music, Pause, Play, RotateCw, Upload, X } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { Button, IconButton } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toaster";
import { SECTION_KINDS } from "@/domain/media-rules";
import type { MediaAsset } from "@/domain/models";
import { acceptedTypes, fileFacts } from "@/features/media/media-format";
import { useMediaUpload, type UploadStatus } from "@/features/media/upload/use-media-upload";
import { cn } from "@/lib/cn";
import { clock, percent } from "@/lib/format";
import { useTrackPlayer } from "../use-track-player";

const STATUS_TEXT: Record<UploadStatus, string> = {
  measuring: "Leyendo el archivo…",
  requesting: "Preparando…",
  uploading: "Subiendo",
  confirming: "Guardando…",
  done: "Listo",
  error: "",
};

type Props = {
  audio: MediaAsset | null;
  onChange: (audio: MediaAsset | null) => void;
  error?: string;
};

/**
 * The song's track (contract §10): uploaded right away, kept with the song when it is
 * saved. A replaced or removed track is deleted by the API on save; one uploaded and
 * never saved is cleaned up by the API a day later.
 */
export function TrackField({ audio, onChange, error }: Props) {
  const player = useTrackPlayer();
  const fileInput = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const upload = useMediaUpload({
    section: "music",
    onUploaded: (asset) => {
      player.stop();
      onChange(asset);
      toast.success("Pista lista. Guarda la canción para conservarla.");
    },
  });
  const item = upload.items.at(-1);
  const isUploading = item !== undefined && item.status !== "done" && item.status !== "error";

  function choose(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    for (const previous of upload.items) upload.dismiss(previous.id);
    upload.addFiles([file]);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setIsDragging(false);
    if (!isUploading) choose(event.dataTransfer.files);
  }

  const picker = (
    <input
      ref={fileInput}
      type="file"
      accept={acceptedTypes(SECTION_KINDS.music)}
      className="sr-only"
      tabIndex={-1}
      aria-hidden
      onChange={(event) => {
        choose(event.target.files);
        event.target.value = "";
      }}
    />
  );

  return (
    <Field id="audioId" label="Pista" error={error}>
      <input type="hidden" name="audioId" value={audio?.id ?? ""} />
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          if (event.currentTarget === event.target) setIsDragging(false);
        }}
        onDrop={onDrop}
        className={cn(
          "rounded-md border border-line bg-surface transition-colors",
          !audio && !isUploading && "border-dashed border-line-strong",
          isDragging && "border-coral",
          error && "border-danger/80",
        )}
      >
        {isUploading ? (
          <div className="flex items-center gap-3 p-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-success/14 text-success">
              <Spinner className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{item.title}</p>
              <p className="text-xs text-ink-2">
                {STATUS_TEXT[item.status]}
                {item.status === "uploading" && ` ${percent(item.progress)}`}
              </p>
              <div
                role="progressbar"
                aria-label={`Progreso de ${item.title}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(item.progress * 100)}
                className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-raised"
              >
                <div
                  className="h-full rounded-full bg-accent transition-[width]"
                  style={{ width: `${Math.max(item.progress * 100, 4)}%` }}
                />
              </div>
            </div>
            {item.status === "uploading" && (
              <IconButton label={`Cancelar ${item.title}`} onClick={() => upload.cancel(item.id)}>
                <X />
              </IconButton>
            )}
          </div>
        ) : audio ? (
          <div className="flex items-center gap-3 p-3">
            <IconButton
              label={
                player.stateOf(audio.id) === "playing" ? "Pausar la pista" : "Escuchar la pista"
              }
              isActive={player.stateOf(audio.id) === "playing"}
              disabled={player.stateOf(audio.id) === "loading"}
              onClick={() => void player.toggle(audio)}
              className="text-success"
            >
              {player.stateOf(audio.id) === "loading" ? (
                <Spinner className="size-4" />
              ) : player.stateOf(audio.id) === "playing" ? (
                <Pause />
              ) : (
                <Play />
              )}
            </IconButton>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{audio.fileName}</p>
              <p className="truncate text-xs text-ink-2">
                {fileFacts(audio)}
                {audio.durationSeconds !== null && ` · ${clock(audio.durationSeconds)}`}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => fileInput.current?.click()}>
              Cambiar
            </Button>
            <IconButton
              label="Quitar la pista"
              onClick={() => {
                player.stop();
                onChange(null);
              }}
            >
              <X />
            </IconButton>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex w-full cursor-pointer items-center gap-3 rounded-md p-3 text-left transition-colors hover:bg-surface-raised"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-success/14 text-success">
              <Music aria-hidden className="size-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Subir pista</span>
              <span className="block text-xs text-ink-2">
                Opcional. MP3, M4A, AAC o WAV, hasta 200 MB. También puedes arrastrarla aquí.
              </span>
            </span>
            <Upload aria-hidden className="size-4 text-ink-2" />
          </button>
        )}
      </div>
      {item?.status === "error" && (
        <p role="alert" className="flex items-center gap-2 text-xs font-medium text-danger">
          {item.error}
          {item.canRetry && (
            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCw className="size-3.5" />}
              onClick={() => upload.retry(item.id)}
            >
              Reintentar
            </Button>
          )}
        </p>
      )}
      {picker}
    </Field>
  );
}
