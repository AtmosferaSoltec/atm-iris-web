"use client";

import {
  CheckSquare,
  ChevronRight,
  Download,
  ListMusic,
  Music,
  Pause,
  Play,
  Plus,
  Quote,
  Search,
  Square,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { debounce, useQueryStates } from "nuqs";
import { useRef, useState, useTransition, type DragEvent } from "react";
import { Banner } from "@/components/ui/banner";
import { Button, ButtonLink, IconButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { Surface } from "@/components/ui/surface";
import { TextField } from "@/components/ui/text-field";
import { toast } from "@/components/ui/toaster";
import { SECTION_KINDS } from "@/domain/media-rules";
import type { Church, Paginated, SongSummary } from "@/domain/models";
import { StorageUsage } from "@/features/church/components/storage-usage";
import { UploadQueue } from "@/features/media/components/upload-queue";
import { acceptedTypes } from "@/features/media/media-format";
import { useMediaUpload } from "@/features/media/upload/use-media-upload";
import { cn } from "@/lib/cn";
import { clock } from "@/lib/format";
import { songSearchParams } from "@/lib/search-params";
import { plural } from "@/lib/text";
import { useSlashFocus } from "@/lib/use-slash-focus";
import { createTrackSong, deleteSongs, exportSongs, importSongs } from "../actions";
import { useTrackPlayer, type PlayState } from "../use-track-player";

type Props = { songs: Paginated<SongSummary>; storage: Church["storage"] };

/**
 * The church's songs (contract §10): the lyrics shown on the TV and the track played
 * in the room, together. Search and page live in the URL; the server loads each page.
 */
export function SongLibrary({ songs, storage }: Props) {
  const [isLoading, startTransition] = useTransition();
  const [params, setParams] = useQueryStates(songSearchParams, {
    shallow: false,
    startTransition,
  });
  // The field answers at once; the URL (and the server) follow 300 ms later.
  const [query, setQuery] = useState(params.search);
  const searchRef = useRef<HTMLInputElement>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const trackInput = useRef<HTMLInputElement>(null);
  const [isExporting, startExport] = useTransition();
  const [isImporting, startImport] = useTransition();
  const [isDragging, setIsDragging] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const player = useTrackPlayer();
  // Each track uploaded here becomes a song with just that track, named after the file.
  const upload = useMediaUpload({
    section: "music",
    onUploaded: async (asset) => {
      const result = await createTrackSong(asset.id, asset.title);
      if (result.error) return result.error;
      toast.success(`Se creó la canción «${asset.title}»`);
    },
  });
  useSlashFocus(searchRef);

  const isFiltered = params.search.trim().length > 0;

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length > 0) upload.addFiles(event.dataTransfer.files);
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelection() {
    setIsSelecting(false);
    setSelectedIds(new Set());
  }

  function confirmBulkDelete() {
    startDelete(async () => {
      player.stop();
      const { deleted, failed } = await deleteSongs([...selectedIds]);
      setIsConfirmingDelete(false);
      exitSelection();
      if (failed > 0) {
        toast.error(`Se eliminaron ${deleted}, ${failed} no se pudieron borrar.`);
      } else {
        toast.success(`Se eliminó ${plural(deleted, "canción", "canciones")}`);
      }
    });
  }

  function onExport() {
    startExport(async () => {
      const result = await exportSongs();
      if (result.error || !result.songs) {
        toast.error(result.error ?? "No pudimos exportar las letras.");
        return;
      }
      if (result.songs.length === 0) {
        toast.error("Aún no hay letras para exportar.");
        return;
      }
      const blob = new Blob([JSON.stringify({ songs: result.songs }, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `letras-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Se exportó ${plural(result.songs.length, "letra")}`);
    });
  }

  async function onImportFile(file: File) {
    let data: unknown;
    try {
      data = JSON.parse(await file.text());
    } catch {
      toast.error("Ese archivo no es un JSON válido.");
      return;
    }
    startImport(async () => {
      const result = await importSongs(data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.failed > 0) {
        toast.error(`Se importaron ${result.imported}, ${result.failed} no se pudieron guardar.`);
      } else {
        toast.success(`Se importó ${plural(result.imported, "letra")}`);
      }
    });
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
        title="Canciones"
        description="La letra que se proyecta en el TV y la pista que suena en el salón, juntas. Una canción puede tener solo letra, solo pista o las dos."
        actions={
          isSelecting ? (
            <>
              <span className="text-sm text-ink-2 tabular-nums">
                {plural(selectedIds.size, "seleccionada", "seleccionadas")}
              </span>
              <Button
                variant="secondary"
                onClick={() =>
                  setSelectedIds(
                    selectedIds.size === songs.data.length
                      ? new Set()
                      : new Set(songs.data.map((song) => song.id)),
                  )
                }
              >
                {selectedIds.size === songs.data.length ? "Quitar selección" : "Seleccionar todas"}
              </Button>
              <Button
                variant="danger"
                icon={<Trash2 className="size-4" />}
                disabled={selectedIds.size === 0}
                onClick={() => setIsConfirmingDelete(true)}
              >
                Eliminar
              </Button>
              <IconButton label="Cancelar selección" onClick={exitSelection}>
                <X />
              </IconButton>
            </>
          ) : (
            <>
              {songs.data.length > 0 && (
                <Button variant="secondary" onClick={() => setIsSelecting(true)}>
                  Seleccionar
                </Button>
              )}
              <Button
                variant="secondary"
                icon={<Download className="size-4" />}
                isLoading={isExporting}
                onClick={onExport}
              >
                Exportar
              </Button>
              <Button
                variant="secondary"
                icon={<Upload className="size-4" />}
                isLoading={isImporting}
                onClick={() => importInput.current?.click()}
              >
                Importar
              </Button>
              <input
                ref={importInput}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void onImportFile(file);
                  event.target.value = "";
                }}
              />
              <Button
                variant="secondary"
                icon={<Music className="size-4" />}
                onClick={() => trackInput.current?.click()}
              >
                Subir pistas
              </Button>
              <input
                ref={trackInput}
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
              <ButtonLink href="/canciones/nueva" icon={<Plus className="size-4" />}>
                Nueva canción
              </ButtonLink>
            </>
          )
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
            id="song-search"
            type="search"
            aria-label="Buscar canciones"
            placeholder="Título, autor o letra"
            icon={<Search />}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              void setParams(
                { search: event.target.value || null, page: null },
                { limitUrlUpdates: event.target.value ? debounce(300) : undefined },
              );
            }}
            containerClassName="w-full sm:max-w-md"
          />
          {songs.meta.total > 0 && (
            <span className="text-sm text-ink-2 tabular-nums">
              {plural(songs.meta.total, "canción", "canciones")}
            </span>
          )}
        </div>

        <div className={cn("transition-opacity", isLoading && "opacity-60")} aria-busy={isLoading}>
          {songs.meta.total === 0 && !isFiltered ? (
            <EmptyState
              icon={<ListMusic />}
              title="Aún no hay canciones"
              description="Usa «Nueva canción» para escribir la letra y subir su pista, o arrastra tus pistas a esta página: cada archivo se vuelve una canción."
            />
          ) : songs.data.length === 0 ? (
            <EmptyState
              icon={<Search />}
              title="Sin resultados"
              description={`No encontramos canciones para «${params.search}».`}
            />
          ) : (
            <ul className="divide-y divide-line">
              {songs.data.map((song) => (
                <li key={song.id}>
                  <SongRow
                    song={song}
                    playState={song.audio ? player.stateOf(song.audio.id) : "idle"}
                    onTogglePlay={() => song.audio && void player.toggle(song.audio)}
                    isSelecting={isSelecting}
                    isSelected={selectedIds.has(song.id)}
                    onToggleSelected={() => toggleSelected(song.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <Pagination
          meta={songs.meta}
          onPageChange={(page) => void setParams({ page })}
          className="border-t border-line px-4 py-3 sm:px-6"
        />
      </Surface>

      <ConfirmDialog
        open={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        onConfirm={confirmBulkDelete}
        title={`¿Eliminar ${plural(selectedIds.size, "canción", "canciones")}?`}
        description="Se borran con su letra y su pista. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        isPending={isDeleting}
      />
    </div>
  );
}

function SongRow({
  song,
  playState,
  onTogglePlay,
  isSelecting,
  isSelected,
  onToggleSelected,
}: {
  song: SongSummary;
  playState: PlayState;
  onTogglePlay: () => void;
  isSelecting: boolean;
  isSelected: boolean;
  onToggleSelected: () => void;
}) {
  const facts = [
    song.author || "Sin autor",
    song.sectionCount > 0 ? plural(song.sectionCount, "diapositiva") : "Solo pista",
  ].join(" · ");

  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold group-hover:underline">{song.title}</p>
        <p className="truncate text-sm text-ink-2">{facts}</p>
      </div>
      <p className="hidden min-w-0 flex-1 truncate font-serif text-[15px] text-ink-2 italic md:block">
        {song.firstLine}
      </p>
      {song.audio && (
        <span className="flex shrink-0 items-center gap-1.5 font-mono text-sm text-ink-2 tabular-nums">
          <Music aria-label="Con pista" className="size-3.5 text-success" />
          {song.audio.durationSeconds !== null && clock(song.audio.durationSeconds)}
        </span>
      )}
    </>
  );

  if (isSelecting) {
    return (
      <button
        type="button"
        onClick={onToggleSelected}
        aria-pressed={isSelected}
        aria-label={
          isSelected ? `Quitar «${song.title}» de la selección` : `Seleccionar «${song.title}»`
        }
        className="group flex w-full cursor-pointer items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-surface sm:px-6"
      >
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center",
            isSelected ? "text-accent" : "text-ink-2",
          )}
        >
          {isSelected ? <CheckSquare className="size-5" /> : <Square className="size-5" />}
        </span>
        {content}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-surface sm:px-6">
      {song.audio ? (
        <IconButton
          label={playState === "playing" ? `Pausar ${song.title}` : `Escuchar ${song.title}`}
          isActive={playState === "playing"}
          onClick={onTogglePlay}
          disabled={playState === "loading"}
          className="size-10 text-success"
        >
          {playState === "loading" ? (
            <Spinner className="size-4" />
          ) : playState === "playing" ? (
            <Pause />
          ) : (
            <Play />
          )}
        </IconButton>
      ) : (
        <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-ember/14 text-ember">
          <Quote aria-hidden className="size-[18px]" />
        </span>
      )}
      <Link
        href={`/canciones/${song.id}`}
        className="group flex min-w-0 flex-1 items-center gap-4 py-1"
      >
        {content}
        <ChevronRight
          aria-hidden
          className="size-4 shrink-0 text-ink-3 transition group-hover:translate-x-0.5 group-hover:text-ink"
        />
      </Link>
    </div>
  );
}
