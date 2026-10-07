"use client";

import { Music, Pause, Play, Search, Upload } from "lucide-react";
import Link from "next/link";
import { debounce, useQueryStates } from "nuqs";
import { useEffect, useRef, useState, useTransition, type DragEvent } from "react";
import { Banner } from "@/components/ui/banner";
import { Button, IconButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { Surface } from "@/components/ui/surface";
import { TextField } from "@/components/ui/text-field";
import { toast } from "@/components/ui/toaster";
import { SECTION_KINDS } from "@/domain/media-rules";
import type { Church, MediaAsset, Paginated } from "@/domain/models";
import { StorageUsage } from "@/features/church/components/storage-usage";
import { mediaDownloadUrl } from "@/features/media/actions";
import { MediaDetailDialog } from "@/features/media/components/media-detail-dialog";
import { UploadQueue } from "@/features/media/components/upload-queue";
import { acceptedTypes, fileFacts } from "@/features/media/media-format";
import { useMediaUpload } from "@/features/media/upload/use-media-upload";
import { cn } from "@/lib/cn";
import { clock } from "@/lib/format";
import { mediaSearchParams } from "@/lib/search-params";
import { plural } from "@/lib/text";
import { useSlashFocus } from "@/lib/use-slash-focus";

type Props = {
  tracks: Paginated<MediaAsset>;
  storage: Church["storage"];
};

/** Signed URLs last an hour; ask again a little before. */
const URL_TTL_MS = 50 * 60 * 1000;

/**
 * The church's repertoire of tracks (contract §11, `kind=audio`). Uploaded once
 * here; each console downloads only the ones added to a service.
 */
export function MusicLibrary({ tracks, storage }: Props) {
  const [isLoading, startTransition] = useTransition();
  const [params, setParams] = useQueryStates(mediaSearchParams, {
    shallow: false,
    startTransition,
  });
  const [query, setQuery] = useState(params.search);
  const [isDragging, setIsDragging] = useState(false);
  const [open, setOpen] = useState<{ asset: MediaAsset; url: string | null } | null>(null);
  const player = usePlayer();
  const upload = useMediaUpload({ section: "music" });
  const fileInput = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useSlashFocus(searchRef);

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length > 0) upload.addFiles(event.dataTransfer.files);
  }

  async function openDetails(asset: MediaAsset) {
    setOpen({ asset, url: await player.urlFor(asset.id) });
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
        title="Música"
        description="Las pistas que suenan en el salón durante el servicio. Súbelas una vez aquí: el iPad y Windows descargan solo las que agregas a un servicio."
        actions={
          <>
            <Button icon={<Upload className="size-4" />} onClick={() => fileInput.current?.click()}>
              Subir música
            </Button>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={acceptedTypes(SECTION_KINDS.music)}
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

      {storage.quotaBytes > 0 && storage.usedBytes / storage.quotaBytes >= 0.8 && (
        <Banner tone="info">
          Estás por llenar tu espacio.{" "}
          <Link href="/ajustes#plan" className="font-semibold underline underline-offset-2">
            Ver planes con más espacio
          </Link>
        </Banner>
      )}

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
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-4 sm:px-6">
          <TextField
            ref={searchRef}
            id="music-search"
            type="search"
            aria-label="Buscar música"
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
            containerClassName="w-full sm:max-w-xs"
          />
          {tracks.meta.total > 0 && (
            <span className="text-sm text-ink-2 tabular-nums">
              {plural(tracks.meta.total, "pista")}
            </span>
          )}
        </div>

        <div className={cn("transition-opacity", isLoading && "opacity-60")} aria-busy={isLoading}>
          {tracks.data.length === 0 ? (
            params.search ? (
              <EmptyState
                icon={<Search />}
                title="Sin resultados"
                description={`No encontramos música para «${params.search}».`}
              />
            ) : (
              <EmptyState
                icon={<Music />}
                title="Aún no hay música"
                description="Sube tus pistas con el botón o arrástralas a esta página. Puedes elegir varias a la vez."
              />
            )
          ) : (
            <ul className="divide-y divide-line">
              {tracks.data.map((track) => (
                <li key={track.id}>
                  <TrackRow
                    track={track}
                    state={player.stateOf(track.id)}
                    onToggle={() => void player.toggle(track)}
                    onOpen={() => void openDetails(track)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <Pagination
          meta={tracks.meta}
          onPageChange={(page) => void setParams({ page })}
          className="border-t border-line px-4 py-3 sm:px-6"
        />
      </Surface>

      {open && (
        <MediaDetailDialog
          key={open.asset.id}
          asset={open.asset}
          url={open.url}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

type PlayState = "idle" | "loading" | "playing";

function TrackRow({
  track,
  state,
  onToggle,
  onOpen,
}: {
  track: MediaAsset;
  state: PlayState;
  onToggle: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 sm:px-6">
      <IconButton
        label={state === "playing" ? `Pausar ${track.title}` : `Escuchar ${track.title}`}
        isActive={state === "playing"}
        onClick={onToggle}
        disabled={state === "loading"}
        className="text-success"
      >
        {state === "loading" ? (
          <Spinner className="size-4" />
        ) : state === "playing" ? (
          <Pause />
        ) : (
          <Play />
        )}
      </IconButton>
      <button
        type="button"
        onClick={onOpen}
        aria-label={track.title}
        className="group flex min-w-0 flex-1 cursor-pointer items-center gap-4 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold group-hover:underline">{track.title}</span>
          <span className="block truncate text-sm text-ink-2">
            {track.description || fileFacts(track)}
          </span>
        </span>
        {track.durationSeconds !== null && (
          <span className="shrink-0 font-mono text-sm text-ink-2 tabular-nums">
            {clock(track.durationSeconds)}
          </span>
        )}
      </button>
    </div>
  );
}

/** One `<audio>` for the page: playing a track stops the one before. */
function usePlayer() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const urls = useRef(new Map<string, { url: string; at: number }>());
  const [current, setCurrent] = useState<{ id: string; state: PlayState } | null>(null);

  // Leaving the page stops the music.
  useEffect(() => () => audio.current?.pause(), []);

  async function urlFor(id: string): Promise<string | null> {
    const cached = urls.current.get(id);
    if (cached && Date.now() - cached.at < URL_TTL_MS) return cached.url;
    const result = await mediaDownloadUrl(id);
    if (!result.url) return null;
    urls.current.set(id, { url: result.url, at: Date.now() });
    return result.url;
  }

  function element(): HTMLAudioElement {
    if (!audio.current) {
      const created = new Audio();
      created.onended = () => setCurrent(null);
      created.onpause = () =>
        setCurrent((now) => (now?.state === "playing" ? { ...now, state: "idle" } : now));
      audio.current = created;
    }
    return audio.current;
  }

  async function toggle(track: MediaAsset) {
    const player = element();
    if (current?.id === track.id && current.state === "playing") {
      player.pause();
      return;
    }
    if (current?.id === track.id && !player.ended && player.src) {
      setCurrent({ id: track.id, state: "playing" });
      await player.play().catch(() => setCurrent(null));
      return;
    }
    player.pause();
    setCurrent({ id: track.id, state: "loading" });
    const url = await urlFor(track.id);
    if (!url) {
      setCurrent(null);
      toast.error("No pudimos reproducir la pista. Inténtalo de nuevo.");
      return;
    }
    player.src = url;
    try {
      await player.play();
      setCurrent({ id: track.id, state: "playing" });
    } catch {
      setCurrent(null);
      toast.error("No pudimos reproducir la pista. Inténtalo de nuevo.");
    }
  }

  const stateOf = (id: string): PlayState => (current?.id === id ? current.state : "idle");

  return { toggle, stateOf, urlFor };
}
