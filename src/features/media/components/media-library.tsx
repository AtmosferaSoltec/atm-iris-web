"use client";

import { Search, Upload } from "lucide-react";
import { debounce, useQueryStates } from "nuqs";
import { useRef, useState, useTransition, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Surface } from "@/components/ui/surface";
import { TextField } from "@/components/ui/text-field";
import type { Church, MediaAsset, Paginated } from "@/domain/models";
import { StorageUsage } from "@/features/church/components/storage-usage";
import { cn } from "@/lib/cn";
import { clock } from "@/lib/format";
import { mediaSearchParams } from "@/lib/search-params";
import { useSlashFocus } from "@/lib/use-slash-focus";
import { ACCEPTED_TYPES, KIND_COLORS, KIND_ICONS, KIND_LABELS } from "../media-format";
import { useMediaUpload } from "../upload/use-media-upload";
import { MediaDetailDialog } from "./media-detail-dialog";
import { UploadQueue } from "./upload-queue";

type Props = {
  media: Paginated<MediaAsset>;
  /** Signed download URLs by asset id (valid for an hour). */
  urls: Record<string, string | null>;
  storage: Church["storage"];
};

export function MediaLibrary({ media, urls, storage }: Props) {
  const [isLoading, startTransition] = useTransition();
  const [params, setParams] = useQueryStates(mediaSearchParams, {
    shallow: false,
    startTransition,
  });
  const [query, setQuery] = useState(params.search);
  const [openId, setOpenId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const upload = useMediaUpload();
  const fileInput = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useSlashFocus(searchRef);

  const open = media.data.find((asset) => asset.id === openId) ?? null;
  const kind = params.kind;
  const Icon = KIND_ICONS[kind];

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
        title="Multimedia"
        description="Imágenes, videos y música para proyectar y reproducir en el servicio."
        actions={
          <>
            <Button icon={<Upload className="size-4" />} onClick={() => fileInput.current?.click()}>
              Subir archivos
            </Button>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={ACCEPTED_TYPES}
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

      <Surface className="p-5 sm:px-6">
        <StorageUsage usedBytes={storage.usedBytes} quotaBytes={storage.quotaBytes} />
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
        <div className="flex flex-wrap items-center gap-4 border-b border-line p-4 sm:px-6">
          <SegmentedControl
            label="Tipo"
            className="w-full sm:w-auto"
            value={kind}
            onChange={(next) => {
              setOpenId(null);
              void setParams({ kind: next, page: null });
            }}
            options={(["image", "video", "audio"] as const).map((value) => ({
              value,
              label: KIND_LABELS[value].plural,
            }))}
          />
          <TextField
            ref={searchRef}
            id="media-search"
            type="search"
            aria-label="Buscar por título"
            placeholder="Buscar por título"
            icon={<Search />}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              void setParams(
                { search: event.target.value || null, page: null },
                { limitUrlUpdates: event.target.value ? debounce(300) : undefined },
              );
            }}
            containerClassName="w-full sm:ml-auto sm:max-w-xs"
          />
        </div>

        <div className={cn("transition-opacity", isLoading && "opacity-60")} aria-busy={isLoading}>
          {media.data.length === 0 ? (
            params.search ? (
              <EmptyState
                icon={<Search />}
                title="Sin resultados"
                description={`No encontramos ${KIND_LABELS[kind].plural.toLowerCase()} para «${params.search}».`}
              />
            ) : (
              <EmptyState
                icon={<Icon />}
                title={`Aún no hay ${kind === "audio" ? "música" : KIND_LABELS[kind].plural.toLowerCase()}`}
                description="Sube archivos con el botón o arrástralos a esta página."
              />
            )
          ) : kind === "audio" ? (
            <ul className="divide-y divide-line">
              {media.data.map((asset) => (
                <li key={asset.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(asset.id)}
                    className="flex w-full cursor-pointer items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-surface sm:px-6"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-success/14 text-success">
                      <Icon aria-hidden className="size-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{asset.title}</span>
                      {asset.description && (
                        <span className="block truncate text-sm text-ink-2">
                          {asset.description}
                        </span>
                      )}
                    </span>
                    {asset.durationSeconds !== null && (
                      <span className="text-sm text-ink-2 tabular-nums">
                        {clock(asset.durationSeconds)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] gap-5 p-4 sm:p-6">
              {media.data.map((asset) => (
                <li key={asset.id}>
                  <MediaCard
                    asset={asset}
                    url={urls[asset.id] ?? null}
                    onOpen={() => setOpenId(asset.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <Pagination
          meta={media.meta}
          onPageChange={(page) => void setParams({ page })}
          className="border-t border-line px-4 py-3 sm:px-6"
        />
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

function MediaCard({
  asset,
  url,
  onOpen,
}: {
  asset: MediaAsset;
  url: string | null;
  onOpen: () => void;
}) {
  const Icon = KIND_ICONS[asset.kind];
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={asset.isBackground ? `${asset.title}, fondo` : asset.title}
      className="group flex w-full cursor-pointer flex-col gap-2.5 text-left"
    >
      <span className="relative block aspect-video overflow-hidden rounded-md bg-surface ring-1 ring-line transition group-hover:ring-line-strong">
        {url ? (
          asset.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed URLs expire in 1 h; next/image would cache them
            <img src={url} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            // The first frame works as poster: no thumbnails are stored (contract §11).
            <video
              src={`${url}#t=0.1`}
              preload="metadata"
              muted
              className="size-full object-cover"
            />
          )
        ) : (
          <span
            className="grid size-full place-items-center"
            style={{ color: KIND_COLORS[asset.kind] }}
          >
            <Icon aria-hidden className="size-6" />
          </span>
        )}
        {asset.kind === "video" && asset.durationSeconds !== null && (
          <span className="absolute right-2 bottom-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-medium text-white tabular-nums">
            {clock(asset.durationSeconds)}
          </span>
        )}
        {asset.isBackground && (
          <span className="absolute top-2 left-2">
            <Chip color="var(--color-ember)" className="bg-black/60">
              Fondo
            </Chip>
          </span>
        )}
      </span>
      <span className="truncate text-sm font-semibold">{asset.title}</span>
    </button>
  );
}
