"use client";

import {
  Captions,
  ChevronDown,
  ChevronUp,
  ListMusic,
  Pause,
  Play,
  Repeat,
  SkipBack,
  Square,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { IconButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Surface } from "@/components/ui/surface";
import { toast } from "@/components/ui/toaster";
import { ProjectionCanvas } from "@/features/projection/components/projection-canvas";
import { DEFAULT_TYPOGRAPHY, type ProjectionFrame } from "@/features/projection/model";
import { cn } from "@/lib/cn";
import { clock } from "@/lib/format";
import { plural } from "@/lib/text";
import type { ConsoleItem } from "../model";
import { elapsedOf, type LiveConsole } from "../use-live-console";
import { FileStatus } from "./file-status";
import { ENTRY_ICONS } from "./library-panel";

/** SERVICIO over EN VIVO (IRIS_SPEC §6.2, column 1 of the iPad; right column on the desktop). */
export function ServicePanel({ ctrl }: { ctrl: LiveConsole }) {
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <Surface className="flex min-h-0 flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2 px-1">
          <h2 className="eyebrow text-ink-2">
            Servicio <span className="ml-1 font-mono tabular-nums">{ctrl.items.length}</span>
          </h2>
          {ctrl.items.length > 0 && (
            <button
              type="button"
              onClick={() => setIsConfirmingClear(true)}
              className="cursor-pointer text-xs font-medium text-ink-2 hover:text-danger"
            >
              Vaciar
            </button>
          )}
        </div>

        {ctrl.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center text-ink-2">
            <ListMusic aria-hidden className="size-7" />
            <p className="text-sm font-medium text-ink">Servicio vacío</p>
            <p className="text-xs">Agrega canciones o multimedia desde la biblioteca.</p>
          </div>
        ) : (
          <ol className="-mx-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
            {ctrl.items.map((item, index) => (
              <ServiceRow
                key={item.planItemId}
                item={item}
                index={index}
                fileState={ctrl.fileState}
                isOpen={item.planItemId === ctrl.openKey}
                isLive={item.planItemId === ctrl.live?.key && !ctrl.isCleared}
                isFirst={index === 0}
                isLast={index === ctrl.items.length - 1}
                onOpen={() => ctrl.setOpenKey(item.planItemId)}
                onMove={(offset) => ctrl.move(item.planItemId, offset)}
                onRemove={() => ctrl.remove(item.planItemId)}
              />
            ))}
          </ol>
        )}
      </Surface>

      <Surface className="flex flex-col gap-3 p-3">
        <div className="relative overflow-hidden rounded-md ring-1 ring-line-strong">
          <ProjectionCanvas
            frame={ctrl.liveFrame}
            transitions
            playsVideo
            audible
            onVideoTime={(time) => ctrl.followVideo(time.id, time.position, time.duration, true)}
            onVideoError={(message) => toast.error(message)}
          />
          <span className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold tracking-[0.12em] text-white uppercase backdrop-blur">
            <span className="size-1.5 animate-pulse-live rounded-full bg-live" />
            En vivo
          </span>
        </div>
        {ctrl.playback && <NowPlaying ctrl={ctrl} />}
      </Surface>

      <ConfirmDialog
        open={isConfirmingClear}
        onClose={() => setIsConfirmingClear(false)}
        onConfirm={() => {
          ctrl.clear();
          setIsConfirmingClear(false);
        }}
        title="¿Vaciar el servicio?"
        description="Se quita todo lo que está en el servicio. Esta acción no se puede deshacer."
        confirmLabel={`Quitar ${plural(ctrl.items.length, "elemento")}`}
      />
    </div>
  );
}

function ServiceRow({
  item,
  index,
  fileState,
  isOpen,
  isLive,
  isFirst,
  isLast,
  onOpen,
  onMove,
  onRemove,
}: {
  item: ConsoleItem;
  index: number;
  /** Whether the item's file is already on the screens. */
  fileState: LiveConsole["fileState"];
  isOpen: boolean;
  isLive: boolean;
  isFirst: boolean;
  isLast: boolean;
  onOpen: () => void;
  onMove: (offset: number) => void;
  onRemove: () => void;
}) {
  const { icon: Icon, color } = ENTRY_ICONS[item.kind];
  return (
    <li
      className={cn(
        "group relative flex items-center gap-3 rounded-md py-2 pr-1 pl-3 transition-colors",
        isOpen ? "bg-surface-raised" : "hover:bg-surface",
      )}
    >
      {isOpen && (
        <span
          aria-hidden
          className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-accent"
        />
      )}
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
        onKeyDown={(event) => {
          if (event.key === "Delete" || event.key === "Backspace") onRemove();
        }}
      >
        <span className="w-5 shrink-0 font-mono text-xs text-ink-2 tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          className="grid size-9 shrink-0 place-items-center rounded-sm"
          style={{ color, backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
        >
          <Icon aria-hidden className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold">{item.title}</span>
            {isLive && (
              <span aria-label="En vivo" className="size-1.5 shrink-0 rounded-full bg-live" />
            )}
          </span>
          {item.subtitle && (
            <span className="block truncate text-xs text-ink-2">{item.subtitle}</span>
          )}
        </span>
        {(item.kind === "image" || item.kind === "video") && item.file && (
          <FileStatus state={fileState(item.file.id)} className="mr-1" />
        )}
      </button>
      <span className="hidden shrink-0 items-center group-focus-within:flex group-hover:flex">
        <IconButton
          label="Subir"
          className="size-7 ring-0"
          disabled={isFirst}
          onClick={() => onMove(-1)}
        >
          <ChevronUp />
        </IconButton>
        <IconButton
          label="Bajar"
          className="size-7 ring-0"
          disabled={isLast}
          onClick={() => onMove(1)}
        >
          <ChevronDown />
        </IconButton>
        <IconButton
          label={`Quitar «${item.title}»`}
          className="size-7 ring-0 hover:text-danger"
          onClick={onRemove}
        >
          <X />
        </IconButton>
      </span>
    </li>
  );
}

/** Mini player (IRIS_SPEC §6.2): only while a track or a video is loaded. */
function NowPlaying({ ctrl }: { ctrl: LiveConsole }) {
  const playback = ctrl.playback!;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!playback.playing) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [playback.playing]);

  const elapsed = elapsedOf(playback, playback.playing ? now : playback.at);
  const remaining = Math.max(0, playback.duration - elapsed);
  const isTrack = playback.kind === "track";

  return (
    <div className="flex flex-col gap-2 px-1">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            isTrack ? "bg-success" : "bg-rose",
            playback.playing && "animate-pulse-live",
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{playback.title}</span>
          <span className="block text-xs text-ink-2">
            {!playback.playing
              ? "En pausa"
              : isTrack
                ? "Sonando en el salón"
                : "Reproduciendo en la pantalla"}
          </span>
        </span>
      </div>
      {playback.youTube && isTrack && <YouTubeTrack ctrl={ctrl} />}
      <input
        type="range"
        aria-label="Posición"
        min={0}
        max={Math.max(playback.duration, 1)}
        step={0.5}
        value={elapsed}
        onChange={(event) => ctrl.seek(Number(event.target.value))}
        className="w-full accent-coral"
      />
      <div className="flex items-center justify-between font-mono text-[11px] text-ink-2 tabular-nums">
        <span>{clock(Math.floor(elapsed))}</span>
        <span>-{clock(Math.ceil(remaining))}</span>
      </div>
      <div className="flex items-center justify-center gap-2">
        <IconButton label="Desde el inicio" onClick={() => ctrl.seek(0)}>
          <SkipBack />
        </IconButton>
        {/* The main control: always the same solid button, only its icon changes. */}
        <button
          type="button"
          aria-label={playback.playing ? "Pausar" : "Reproducir"}
          title={playback.playing ? "Pausar (Espacio)" : "Reproducir (Espacio)"}
          onClick={ctrl.togglePlay}
          className="grid size-11 cursor-pointer place-items-center rounded-full bg-coral text-ink-inverse transition hover:brightness-110 active:scale-95"
        >
          {playback.playing ? (
            <Pause aria-hidden className="size-5" fill="currentColor" />
          ) : (
            <Play aria-hidden className="ml-0.5 size-5" fill="currentColor" />
          )}
        </button>
        <IconButton label="Detener" onClick={ctrl.stopPlayback}>
          <Square />
        </IconButton>
        <IconButton
          label="Repetir"
          aria-pressed={playback.loop}
          onClick={ctrl.toggleLoop}
          className={playback.loop ? "bg-coral/15 text-coral ring-coral/40" : undefined}
        >
          <Repeat />
        </IconButton>
        {playback.captions !== null && (
          <IconButton
            label="Subtítulos"
            aria-pressed={playback.captions}
            onClick={ctrl.toggleCaptions}
            className={playback.captions ? "bg-coral/15 text-coral ring-coral/40" : undefined}
          >
            <Captions />
          </IconButton>
        )}
      </div>
    </div>
  );
}

/**
 * A song's track on YouTube: YouTube's player, visible here with its sound (their terms do not
 * allow playing the sound alone), while the screens keep the lyrics. It follows the controls
 * below like the screens follow a video.
 */
function YouTubeTrack({ ctrl }: { ctrl: LiveConsole }) {
  const { fileId, playing, position, at } = ctrl.playback!;
  const frame = useMemo<ProjectionFrame>(
    () => ({
      background: null,
      content: { kind: "youtube", id: fileId, playing, position, at, captions: false },
      typography: DEFAULT_TYPOGRAPHY,
    }),
    [fileId, playing, position, at],
  );
  return (
    <ProjectionCanvas
      frame={frame}
      playsVideo
      audible
      onVideoTime={(time) => ctrl.followVideo(time.id, time.position, time.duration, true)}
      onVideoError={(message) => toast.error(message)}
      className="rounded-md"
    />
  );
}
