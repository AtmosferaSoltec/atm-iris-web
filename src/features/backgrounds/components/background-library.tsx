"use client";

import { ImagePlay, Upload } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Surface } from "@/components/ui/surface";
import { BACKGROUND_RULES, BACKGROUND_TYPES } from "@/domain/media-rules";
import type { Church, MediaAsset, Paginated } from "@/domain/models";
import { StorageUsage } from "@/features/church/components/storage-usage";
import { MediaDetailDialog } from "@/features/media/components/media-detail-dialog";
import { UploadQueue } from "@/features/media/components/upload-queue";
import { useMediaUpload } from "@/features/media/upload/use-media-upload";
import { cn } from "@/lib/cn";
import { clock } from "@/lib/format";

type Props = {
  backgrounds: Paginated<MediaAsset>;
  /** Signed download URLs by asset id (valid for an hour). */
  urls: Record<string, string | null>;
  storage: Church["storage"];
};

const REQUIREMENTS = [
  {
    title: "Imagen",
    lines: [
      "JPG, PNG o WebP",
      "1920 × 1080 recomendado (16:9, mínimo 1280 × 720)",
      `Hasta ${BACKGROUND_RULES.image.maxBytes / 1024 / 1024} MB`,
    ],
  },
  {
    title: "Video",
    lines: [
      "MP4, 1920 × 1080 recomendado (16:9)",
      `Hasta ${BACKGROUND_RULES.video.maxSeconds} segundos: se repite en bucle y sin sonido`,
      `Hasta ${BACKGROUND_RULES.video.maxBytes / 1024 / 1024} MB`,
    ],
  },
];

export function BackgroundLibrary({ backgrounds, urls, storage }: Props) {
  const upload = useMediaUpload({ section: "backgrounds" });
  const fileInput = useRef<HTMLInputElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const open = backgrounds.data.find((asset) => asset.id === openId) ?? null;

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length > 0) upload.addFiles(event.dataTransfer.files);
  }

  return (
    <div
      className="mx-auto flex max-w-content flex-col gap-8"
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setIsDragging(false);
      }}
      onDrop={onDrop}
    >
      <PageHeader
        title="Fondos"
        description="Imágenes y videos que se muestran detrás de la letra de las canciones. Aparecen en el selector de fondos del iPad y de Windows."
        actions={
          <>
            <Button icon={<Upload className="size-4" />} onClick={() => fileInput.current?.click()}>
              Subir fondos
            </Button>
            <input
              ref={fileInput}
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
          </>
        }
      />

      <Surface className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
        {REQUIREMENTS.map((group) => (
          <section key={group.title} aria-label={`Requisitos de ${group.title.toLowerCase()}`}>
            <h2 className="eyebrow text-ink-2">{group.title}</h2>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {group.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
        <StorageUsage
          usedBytes={storage.usedBytes}
          quotaBytes={storage.quotaBytes}
          className="sm:col-span-2"
        />
      </Surface>

      <UploadQueue
        items={upload.items}
        onCancel={upload.cancel}
        onRetry={upload.retry}
        onDismiss={upload.dismiss}
        onClearFinished={upload.clearFinished}
      />

      <Surface
        className={cn(
          "overflow-hidden transition",
          isDragging && "ring-2 ring-coral ring-offset-2 ring-offset-canvas",
        )}
      >
        {backgrounds.data.length === 0 ? (
          <EmptyState
            icon={<ImagePlay />}
            title="Aún no hay fondos"
            description="Sube una imagen o un video, o arrástralos a esta página."
          />
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-5 p-4 sm:p-6">
            {backgrounds.data.map((asset) => (
              <li key={asset.id}>
                <BackgroundCard
                  asset={asset}
                  url={urls[asset.id] ?? null}
                  onOpen={() => setOpenId(asset.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </Surface>

      {open && (
        <MediaDetailDialog
          key={open.id}
          asset={open}
          url={urls[open.id] ?? null}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

function BackgroundCard({
  asset,
  url,
  onOpen,
}: {
  asset: MediaAsset;
  url: string | null;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={asset.title}
      className="group flex w-full cursor-pointer flex-col gap-2.5 text-left"
    >
      <span className="relative block aspect-video overflow-hidden rounded-md bg-surface ring-1 ring-line transition group-hover:ring-line-strong">
        {url &&
          (asset.kind === "video" ? (
            // Muted and looping, like the console plays it behind the lyrics.
            <video
              src={url}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="size-full object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- signed URLs expire in 1 h; next/image would cache them
            <img src={url} alt="" loading="lazy" className="size-full object-cover" />
          ))}
        {asset.kind === "video" && asset.durationSeconds !== null && (
          <span className="absolute right-2 bottom-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-medium text-white tabular-nums">
            {clock(asset.durationSeconds)}
          </span>
        )}
      </span>
      <span className="truncate text-sm font-semibold">{asset.title}</span>
    </button>
  );
}
