"use client";

import { Maximize } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { screenChannel, type PreloadFile } from "../channel";
import { FileResolverProvider, type ResolveFile } from "../file-resolver";
import { BLACK_FRAME, rebaseFrame, type ProjectionFrame } from "../model";
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
  const files = useFileCache((ready) => reportFiles.current(ready));
  const { announce, readyIds } = files;
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
          frame={frame}
          transitions
          playsVideo
          onVideoTime={onVideoTime}
          className="max-h-dvh w-full max-w-[calc(100dvh*16/9)]"
        />

        {!hasConsole && (
          <div className="absolute inset-x-0 bottom-[8vh] flex flex-col items-center gap-3 text-center text-sm text-white/45">
            <p>
              {source.kind === "remote"
                ? "Televisor conectado. Esperando la consola… Abre «Iniciar servicio» en tu computadora."
                : "Esperando la consola… Abre «Iniciar servicio» en la otra pantalla."}
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
        onFrame(data);
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

type CachedFile = {
  /** The URL it was announced with, to tell a refreshed signed URL from a new file. */
  url: string;
  kind: PreloadFile["kind"];
  /** `blob:` URL once the whole file is in memory (images and background videos). */
  objectUrl: string | null;
  /** Detached element that keeps a service video buffered. */
  video: HTMLVideoElement | null;
  ready: boolean;
  abort: AbortController;
};

/**
 * The screen's files, by media id, for as long as this page is open (a TV left on all
 * week keeps them; reloading downloads them again). Images and background videos are
 * downloaded whole and shown from memory; a service video is buffered by a hidden player.
 */
function useFileCache(onReadyChange: (ready: string[]) => void) {
  const cache = useRef(new Map<string, CachedFile>());
  const notify = useRef(onReadyChange);
  // A version bump re-renders the canvas so it switches to the in-memory copy.
  const [, setVersion] = useState(0);

  useEffect(() => {
    notify.current = onReadyChange;
  });

  const readyIds = useCallback(
    () => [...cache.current].filter(([, file]) => file.ready).map(([id]) => id),
    [],
  );

  const markReady = useCallback(
    (id: string, file: CachedFile) => {
      if (cache.current.get(id) !== file) return;
      file.ready = true;
      setVersion((version) => version + 1);
      notify.current(readyIds());
    },
    [readyIds],
  );

  const drop = useCallback((id: string) => {
    const file = cache.current.get(id);
    if (!file) return;
    file.abort.abort();
    if (file.objectUrl) URL.revokeObjectURL(file.objectUrl);
    if (file.video) {
      file.video.removeAttribute("src");
      file.video.load();
    }
    cache.current.delete(id);
  }, []);

  const announce = useCallback(
    (files: PreloadFile[]) => {
      const announced = new Map(files.map((file) => [file.id, file]));
      for (const id of [...cache.current.keys()]) {
        if (!announced.has(id)) drop(id);
      }
      for (const { id, url, kind } of files) {
        const existing = cache.current.get(id);
        // A refreshed signed URL for a file already here changes nothing.
        if (existing && (existing.ready || existing.url === url)) continue;
        if (existing) drop(id);
        const file: CachedFile = {
          url,
          kind,
          objectUrl: null,
          video: null,
          ready: false,
          abort: new AbortController(),
        };
        cache.current.set(id, file);
        if (kind === "video") {
          const video = document.createElement("video");
          video.muted = true;
          video.preload = "auto";
          video.addEventListener("canplaythrough", () => markReady(id, file), { once: true });
          video.src = url;
          file.video = video;
        } else {
          void fetch(url, { signal: file.abort.signal })
            .then((response) =>
              response.ok ? response.blob() : Promise.reject(new Error(String(response.status))),
            )
            .then((blob) => {
              file.objectUrl = URL.createObjectURL(blob);
              markReady(id, file);
            })
            .catch(() => {
              // Not reachable now: the canvas keeps using the network URL.
            });
        }
      }
      notify.current(readyIds());
    },
    [drop, markReady, readyIds],
  );

  // Freed when the page goes away.
  useEffect(() => {
    const files = cache.current;
    return () => {
      for (const id of [...files.keys()]) drop(id);
    };
  }, [drop]);

  const resolve = useCallback<ResolveFile>(
    (id, url) => cache.current.get(id)?.objectUrl ?? url,
    [],
  );

  return { announce, readyIds, resolve };
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
