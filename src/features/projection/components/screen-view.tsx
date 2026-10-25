"use client";

import { Maximize } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { screenChannel, type PreloadFile } from "../channel";
import { FileCache } from "../file-cache";
import { FileResolverProvider } from "../file-resolver";
import { requestPersistentStorage } from "../file-store";
import {
  BLACK_FRAME,
  rebaseFrame,
  type ProjectionBackground,
  type ProjectionFrame,
} from "../model";
import { ProjectionCanvas } from "./projection-canvas";

/** Heartbeat to the console: it shows "Pantalla conectada" while these keep coming. */
const ALIVE_EVERY_MS = 2000;
const HIDE_CURSOR_AFTER_MS = 2500;

/** Where the screen hears the console: the same browser, or the internet (a linked TV). */
export type ScreenSource = { kind: "local"; churchId: string } | { kind: "remote" };

/**
 * `/display`: what the room sees. Only the projection, full screen, no controls. It
 * draws whatever the console sends and keeps the files it is told about already loaded,
 * so changing a background or showing an image never waits on the network.
 */
export function ScreenView({
  source,
  onUnlinked,
  onLinkInstead,
}: {
  source: ScreenSource;
  /** A remote TV that was unlinked from the console: back to its code. */
  onUnlinked?: () => void;
  /** A screen next to the console that is really a TV: show its code instead. */
  onLinkInstead?: () => void;
}) {
  const [frame, setFrame] = useState<ProjectionFrame>(BLACK_FRAME);
  const [hasConsole, setHasConsole] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPointerIdle, setIsPointerIdle] = useState(false);
  // Set after render: the file cache tells a console in this browser what it has ready.
  const reportFiles = useRef<(ready: string[]) => void>(() => undefined);
  const { files, pending } = useFileCache((ready) => reportFiles.current(ready));
  const { announce, readyIds } = files;

  // A background still downloading is not drawn yet: the previous one stays until it is
  // here, and then it shows from the local copy. Drawing it early would start a second
  // download of the same file over the same weak connection, with a grey box meanwhile.
  const wanted = frame.background;
  const isPending = wanted !== null && pending.has(wanted.id);
  const [shownBackground, setShownBackground] = useState<ProjectionBackground | null>(null);
  if (!isPending && shownBackground !== wanted) setShownBackground(wanted);
  const shownFrame = useMemo(
    () =>
      frame.background === shownBackground ? frame : { ...frame, background: shownBackground },
    [frame, shownBackground],
  );
  useEffect(() => {
    if (isPending && wanted) files.prioritize(wanted.id);
  }, [isPending, wanted, files]);
  const showFrame = useCallback((next: ProjectionFrame) => {
    setHasConsole(true);
    setFrame(next);
  }, []);

  const local = useLocalSource(source.kind === "local" ? source.churchId : null, {
    showFrame,
    announce,
    readyIds,
  });
  useRemoteSource(source.kind === "remote", { showFrame, announce, onUnlinked });
  useEffect(() => {
    reportFiles.current = local.reportFiles;
  });

  useWakeLock();

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement !== null);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // The cursor disappears while still, like any video player.
  useEffect(() => {
    let timer = setTimeout(() => setIsPointerIdle(true), HIDE_CURSOR_AFTER_MS);
    const onMove = () => {
      setIsPointerIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIsPointerIdle(true), HIDE_CURSOR_AFTER_MS);
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  const goFullscreen = useCallback(() => {
    void document.documentElement.requestFullscreen?.().catch(() => undefined);
  }, []);

  // "F" or Enter (the TV remote's OK) go full screen.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "f" || event.key === "F" || event.key === "Enter") goFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goFullscreen]);

  const onVideoTime = local.reportVideoTime;

  return (
    <FileResolverProvider value={files.resolve}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black"
        style={{ cursor: isPointerIdle ? "none" : "default" }}
        onDoubleClick={goFullscreen}
      >
        <ProjectionCanvas
          frame={shownFrame}
          transitions
          playsVideo
          onVideoTime={onVideoTime}
          className="max-h-dvh w-full max-w-[calc(100dvh*16/9)]"
        />

        {!hasConsole && (
          <div className="absolute inset-x-0 bottom-[8vh] flex flex-col items-center gap-3 text-center text-sm text-white/45">
            <p>
              {source.kind === "remote"
                ? "Pantalla conectada. Esperando la consola… Abre Iris en tu computadora."
                : "Esperando la consola… Abre Iris en la otra pantalla."}
            </p>
            {onLinkInstead && (
              <button
                type="button"
                onClick={onLinkInstead}
                className="cursor-pointer text-white/70 underline-offset-4 hover:text-white hover:underline"
              >
                ¿Es un televisor en otro lugar? Conéctalo con un código
              </button>
            )}
          </div>
        )}

        {!isFullscreen && !isPointerIdle && (
          <button
            type="button"
            onClick={goFullscreen}
            className="absolute right-6 bottom-6 flex cursor-pointer items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur-xl transition hover:bg-white/20"
          >
            <Maximize aria-hidden className="size-4" />
            Pantalla completa
          </button>
        )}
      </div>
    </FileResolverProvider>
  );
}

type LocalSourceOptions = {
  showFrame: (frame: ProjectionFrame) => void;
  announce: (files: PreloadFile[]) => void;
  readyIds: () => string[];
};

/** The console in this same browser (a window on screen 2/3): a BroadcastChannel. */
function useLocalSource(
  churchId: string | null,
  { showFrame, announce, readyIds }: LocalSourceOptions,
) {
  const channelRef = useRef<ReturnType<typeof screenChannel> | null>(null);
  const screenId = useRef("");

  useEffect(() => {
    if (!churchId) return;
    let lastSeq = -1;
    screenId.current = crypto.randomUUID();
    const channel = screenChannel(churchId);
    channelRef.current = channel;
    const id = screenId.current;
    const stop = channel.listen((message) => {
      if (message.type === "frame") {
        // A console reloaded starts again from 0.
        if (message.seq <= lastSeq && message.seq !== 0) return;
        lastSeq = message.seq;
        showFrame(message.frame);
      } else if (message.type === "preload") {
        announce(message.files);
      }
    });
    const alive = () =>
      channel.send({
        type: "alive",
        screenId: id,
        width: screen.width,
        height: screen.height,
        ready: readyIds(),
      });
    channel.send({ type: "hello", screenId: id });
    const timer = setInterval(alive, ALIVE_EVERY_MS);
    const bye = () => channel.send({ type: "bye", screenId: id });
    window.addEventListener("pagehide", bye);
    return () => {
      bye();
      window.removeEventListener("pagehide", bye);
      clearInterval(timer);
      stop();
      channel.close();
      channelRef.current = null;
    };
  }, [churchId, showFrame, announce, readyIds]);

  const reportFiles = useCallback(
    (ready: string[]) =>
      channelRef.current?.send({ type: "files", screenId: screenId.current, ready }),
    [],
  );
  const reportVideoTime = useCallback(
    (time: { id: string; position: number; duration: number }) =>
      channelRef.current?.send({ type: "videoTime", screenId: screenId.current, ...time }),
    [],
  );
  return { reportFiles, reportVideoTime };
}

type Times = { clock: number | null; receivedAt: number | null; now: number };

/**
 * A linked TV: the console's frames arrive over the internet (contract §18), through this
 * site's `/api/display/stream`. The browser reconnects by itself after a drop; a TV that
 * was unlinked goes back to its code.
 */
function useRemoteSource(
  isRemote: boolean,
  {
    showFrame,
    announce,
    onUnlinked,
  }: {
    showFrame: (frame: ProjectionFrame) => void;
    announce: (files: PreloadFile[]) => void;
    onUnlinked?: () => void;
  },
) {
  const unlinked = useRef(onUnlinked);
  useEffect(() => {
    unlinked.current = onUnlinked;
  });

  useEffect(() => {
    if (!isRemote) return;
    let source: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    // The console's clock to this TV's: (API − console) + (TV − API).
    const shiftOf = ({ clock, receivedAt, now }: Times) =>
      clock === null || receivedAt === null ? 0 : receivedAt - clock + (Date.now() - now);
    const onFrame = (data: Times & { frame: ProjectionFrame | null }) => {
      if (data.frame) showFrame(rebaseFrame(data.frame, shiftOf(data)));
    };

    const connect = () => {
      source = new EventSource("/api/display/stream");
      source.addEventListener("state", (event) => {
        const data = JSON.parse(event.data) as Times & {
          frame: ProjectionFrame | null;
          preload: PreloadFile[];
        };
        announce(data.preload);
        // Without a frame this screen is not the one presenting (or nothing was sent yet): black.
        if (data.frame) onFrame(data);
        else showFrame(BLACK_FRAME);
      });
      source.addEventListener("frame", (event) => onFrame(JSON.parse(event.data)));
      source.addEventListener("preload", (event) =>
        announce((JSON.parse(event.data) as { preload: PreloadFile[] }).preload),
      );
      source.addEventListener("bye", () => {
        source?.close();
        void fetch("/api/display/link", { method: "DELETE" }).finally(() => unlinked.current?.());
      });
      source.onerror = () => {
        // Drops reconnect by themselves; a refused channel closes for good: still linked?
        if (source?.readyState !== EventSource.CLOSED || stopped) return;
        void fetch("/api/display/link")
          .then((response) => response.json() as Promise<{ linked: boolean }>)
          .then(({ linked }) => {
            if (stopped) return;
            if (!linked) unlinked.current?.();
            else retry = setTimeout(connect, 3000);
          })
          .catch(() => {
            if (!stopped) retry = setTimeout(connect, 3000);
          });
      };
    };
    connect();
    return () => {
      stopped = true;
      clearTimeout(retry);
      source?.close();
    };
  }, [isRemote, showFrame, announce]);
}

/** The screen's files (see `FileCache`); `onReadyChange` tells the console which ones it already has. */
function useFileCache(onReadyChange: (ready: string[]) => void) {
  // The files still on their way, as state: a change re-renders the screen so it can switch
  // to the local copy once it is here.
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [files] = useState(() => new FileCache(setPending));

  useEffect(() => {
    files.listen(onReadyChange);
  });

  useEffect(() => {
    requestPersistentStorage();
    return files.dispose;
  }, [files]);

  return { files, pending };
}

/** A screen must never fall asleep in the middle of a service. */
function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = () => {
      if (document.visibilityState !== "visible" || !("wakeLock" in navigator)) return;
      navigator.wakeLock
        .request("screen")
        .then((sentinel) => {
          lock = sentinel;
        })
        .catch(() => undefined);
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      document.removeEventListener("visibilitychange", request);
      void lock?.release().catch(() => undefined);
    };
  }, []);
}
