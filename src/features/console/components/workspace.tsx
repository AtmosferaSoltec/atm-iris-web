"use client";

import { Eraser, ImagePlay, MousePointerClick, Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Button, IconButton } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Surface } from "@/components/ui/surface";
import { ProjectionCanvas } from "@/features/projection/components/projection-canvas";
import {
  DEFAULT_TYPOGRAPHY,
  type ProjectionBackground,
  type ProjectionFrame,
} from "@/features/projection/model";
import { cn } from "@/lib/cn";
import { clock } from "@/lib/format";
import type { ConsoleItem } from "../model";
import type { LiveConsole } from "../use-live-console";
import { FileStatus } from "./file-status";
import { ENTRY_ICONS } from "./library-panel";

const KIND_NAMES: Record<ConsoleItem["kind"], string> = {
  song: "Canción",
  track: "Pista",
  image: "Imagen",
  video: "Video",
  youtube: "YouTube",
};

/** Column 2 (IRIS_SPEC §6.2): the open item. Opening never changes the screens; clicking a card does. */
export function Workspace({ ctrl }: { ctrl: LiveConsole }) {
  const item = ctrl.openItem;

  return (
    <Surface className="flex min-h-0 flex-1 flex-col gap-5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {item ? (
            <>
              <Chip color={ENTRY_ICONS[item.kind].color}>{KIND_NAMES[item.kind]}</Chip>
              <h1 className="mt-2 truncate font-serif text-[28px] leading-tight font-medium">
                {item.title}
              </h1>
              {item.subtitle && <p className="truncate text-sm text-ink-2">{item.subtitle}</p>}
              {item.kind === "song" && (item.file || item.youTubeId) && (
                <TrackButton ctrl={ctrl} item={item} />
              )}
            </>
          ) : (
            <h1 className="font-serif text-[28px] leading-tight font-medium text-ink-2">
              Servicio
            </h1>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <IconButton
            label="Limpiar pantalla (B)"
            aria-pressed={ctrl.isCleared}
            onClick={ctrl.toggleCleared}
            className={ctrl.isCleared ? "bg-coral/15 text-coral ring-coral/40" : undefined}
          >
            <Eraser />
          </IconButton>
          <BackgroundPicker ctrl={ctrl} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!item ? (
          <EmptyHint />
        ) : item.kind === "song" ? (
          <SlideGrid ctrl={ctrl} item={item} />
        ) : (
          <MediaStage ctrl={ctrl} item={item} />
        )}
      </div>
    </Surface>
  );
}

function EmptyHint() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-ink-2">
      <MousePointerClick aria-hidden className="size-7" />
      <p className="text-sm font-medium text-ink">Selecciona un elemento</p>
      <p className="text-xs">
        Ábrelo desde el servicio y haz clic en una diapositiva para enviarla a la pantalla.
      </p>
    </div>
  );
}

/** Black cards with white lyrics, always the same look; the one on the screens glows. */
function SlideGrid({ ctrl, item }: { ctrl: LiveConsole; item: ConsoleItem }) {
  const liveIndex = ctrl.live?.key === item.planItemId && !ctrl.isCleared ? ctrl.live.slide : -1;
  const liveCard = useRef<HTMLLIElement>(null);
  const typography = ctrl.liveFrame.typography;
  const frames = useMemo(
    () =>
      item.slides.map<ProjectionFrame>((slide) => ({
        background: null,
        content: { kind: "text", text: slide.text, footnote: null },
        typography: typography ?? DEFAULT_TYPOGRAPHY,
      })),
    [item.slides, typography],
  );

  // Long songs: keep the card on the screens in view.
  useEffect(() => {
    liveCard.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [liveIndex]);

  if (item.slides.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-2">Esta canción no tiene letra.</p>;
  }

  return (
    <ol className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-4 gap-y-6 p-1">
      {item.slides.map((slide, index) => (
        <li
          key={slide.id}
          ref={index === liveIndex ? liveCard : undefined}
          className="flex flex-col gap-1.5"
        >
          <button
            type="button"
            onClick={() => ctrl.presentSlide(index)}
            aria-label={`Enviar a la pantalla: ${slide.label ?? `diapositiva ${index + 1}`}`}
            aria-current={index === liveIndex ? "true" : undefined}
            className={cn(
              "cursor-pointer overflow-hidden rounded-md transition-shadow",
              index === liveIndex
                ? "shadow-[0_0_24px_-4px_rgb(255_122_89/0.55)] ring-[3px] ring-coral"
                : "ring-1 ring-line hover:ring-line-strong",
            )}
          >
            <ProjectionCanvas frame={frames[index]} />
          </button>
          {slide.label && (
            <span className="truncate text-[13px] font-medium text-ink-2">{slide.label}</span>
          )}
        </li>
      ))}
    </ol>
  );
}

/** A track-only song, an image, a video or a YouTube video: one big card and one action (IRIS_SPEC §6.2). */
function MediaStage({ ctrl, item }: { ctrl: LiveConsole; item: ConsoleItem }) {
  const isActive =
    item.kind === "image"
      ? ctrl.live?.key === item.planItemId && !ctrl.isCleared
      : ctrl.playback?.key === item.planItemId && ctrl.playback.playing;

  const preview = useMemo<ProjectionFrame>(() => {
    if (item.kind === "image" && item.file) {
      return {
        background: null,
        content: { kind: "image", id: item.file.id, url: item.file.url },
        typography: DEFAULT_TYPOGRAPHY,
      };
    }
    if (item.kind === "video" && item.file) {
      return {
        background: null,
        content: {
          kind: "video",
          id: item.file.id,
          url: item.file.url,
          playing: false,
          position: 0,
          at: 0,
        },
        typography: DEFAULT_TYPOGRAPHY,
      };
    }
    if (item.kind === "youtube" && item.youTubeId) {
      return {
        background: null,
        content: {
          kind: "youtube",
          id: item.youTubeId,
          playing: false,
          position: 0,
          at: 0,
          captions: false,
        },
        typography: DEFAULT_TYPOGRAPHY,
      };
    }
    return {
      background: null,
      content: {
        kind: "text",
        text: item.title,
        footnote: item.file?.durationSeconds ? clock(item.file.durationSeconds) : null,
      },
      typography: { fontFamily: "system", fontSizePt: 64 },
    };
  }, [item]);

  const hint =
    item.kind === "track"
      ? item.youTubeId
        ? "La pista suena desde YouTube en esta computadora (el reproductor aparece bajo EN VIVO); la pantalla no cambia."
        : "La pista suena en el salón desde esta computadora; la pantalla no cambia."
      : item.kind === "video"
        ? "El video se muestra en la pantalla, sin sonido. Contrólalo desde el reproductor bajo EN VIVO."
        : item.kind === "youtube"
          ? "Se muestra en la pantalla sin sonido; el sonido sale de esta computadora (EN VIVO). Solo para este servicio."
          : "La imagen se muestra a pantalla completa.";

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <button
        type="button"
        onClick={ctrl.presentMedia}
        disabled={isActive}
        className={cn(
          "relative w-full max-w-[640px] cursor-pointer overflow-hidden rounded-lg transition-shadow disabled:cursor-default",
          isActive
            ? "shadow-[0_0_32px_-6px_rgb(255_122_89/0.55)] ring-[3px] ring-coral"
            : "ring-1 ring-line hover:ring-line-strong",
        )}
      >
        <ProjectionCanvas frame={preview} />
        {isActive && (
          <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-white uppercase">
            {item.kind === "image" ? "En pantalla" : "Reproduciendo"}
          </span>
        )}
      </button>
      <Button size="lg" className="w-[300px]" disabled={isActive} onClick={ctrl.presentMedia}>
        {item.kind === "image"
          ? isActive
            ? "En pantalla"
            : "Mostrar en la pantalla"
          : isActive
            ? "Reproduciendo"
            : "Reproducir"}
      </Button>
      <p className="max-w-md text-center text-sm text-ink-2">{hint}</p>
    </div>
  );
}

/** "Pista" of a song with lyrics: plays it in the room while the slides go to the screens. */
function TrackButton({ ctrl, item }: { ctrl: LiveConsole; item: ConsoleItem }) {
  const isPlaying = ctrl.playback?.key === item.planItemId && ctrl.playback.playing;
  return (
    <button
      type="button"
      onClick={ctrl.toggleTrack}
      title="La pista suena en el salón; la pantalla no cambia (P)"
      className={cn(
        "mt-3 inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-semibold transition active:scale-95",
        isPlaying
          ? "bg-success/15 text-success ring-1 ring-success/40 ring-inset hover:bg-success/20"
          : "bg-success text-ink-inverse hover:brightness-110",
      )}
    >
      {isPlaying ? (
        <Pause aria-hidden className="size-4" />
      ) : (
        <Play aria-hidden className="size-4" />
      )}
      {isPlaying ? "Pausar pista" : "Reproducir pista"}
      {item.file?.durationSeconds ? (
        <span className="font-mono font-medium tabular-nums opacity-70">
          {clock(item.file.durationSeconds)}
        </span>
      ) : null}
    </button>
  );
}

/** FONDOS (IRIS_SPEC §6.5): the six gradients and the church's backgrounds. */
function BackgroundPicker({ ctrl }: { ctrl: LiveConsole }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <IconButton label="Cambiar fondo">
          <ImagePlay />
        </IconButton>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[372px]">
        <h3 className="mb-3 eyebrow text-ink-2">Fondos</h3>
        <div className="grid max-h-[60vh] grid-cols-3 gap-3 overflow-y-auto p-0.5">
          <Swatch
            name="Negro"
            isSelected={ctrl.backgroundId === null}
            onSelect={() => ctrl.setBackgroundId(null)}
          />
          {ctrl.backgrounds.map((background) => (
            <Swatch
              key={background.id}
              name={background.name}
              background={background}
              isSelected={ctrl.backgroundId === background.id}
              state={
                background.imageUrl || background.videoUrl ? ctrl.fileState(background.id) : null
              }
              onSelect={() => ctrl.setBackgroundId(background.id)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Swatch({
  name,
  background,
  isSelected,
  onSelect,
  state = null,
}: {
  name: string;
  background?: ProjectionBackground;
  isSelected: boolean;
  onSelect: () => void;
  /** Whether a church background (a file) is already on the screens. */
  state?: "ready" | "loading" | null;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex cursor-pointer flex-col gap-1.5 text-left"
      aria-pressed={isSelected}
    >
      <span
        className={cn(
          "relative block overflow-hidden rounded-sm",
          isSelected ? "ring-2 ring-white" : "ring-1 ring-line",
        )}
      >
        <ProjectionCanvas
          frame={{
            background: background ?? null,
            content: { kind: "blank" },
            typography: DEFAULT_TYPOGRAPHY,
          }}
        />
        <FileStatus state={state} className="absolute right-1 bottom-1" />
      </span>
      <span className="truncate text-xs text-ink-2">{name}</span>
    </button>
  );
}
