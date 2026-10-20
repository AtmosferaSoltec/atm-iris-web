"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/toaster";
import { consoleChannel, type PreloadFile } from "@/features/projection/channel";
import type {
  ProjectionBackground,
  ProjectionContent,
  ProjectionFrame,
  ProjectionTypography,
} from "@/features/projection/model";
import { clearPlan, movePlanItem, removePlanItem } from "@/features/service-plan/actions";
import { addToService, quickItem, refreshFileUrls } from "./actions";
import { RoomAudio } from "./room-audio";
import { useRemoteDisplays } from "./use-remote-displays";
import type { ConsoleData, ConsoleItem, LibraryEntry } from "./model";

export type LivePosition = { key: string; slide: number };

/**
 * What is playing: a song's track (in the room, from this computer) or a video (on the
 * screens, muted). `position` seconds at `at` (epoch ms) is the source of truth; the
 * screens and the clock derive from it.
 */
export type Playback = {
  key: string;
  kind: "track" | "video";
  /** The file playing, to match what the screen reports. */
  fileId: string;
  title: string;
  playing: boolean;
  position: number;
  at: number;
  duration: number;
  loop: boolean;
  /** YouTube's subtitles on the screens; null for anything that is not a YouTube video. */
  captions: boolean | null;
  /**
   * Played by YouTube's player instead of a file: a YouTube video (on the screens, its sound
   * from EN VIVO) or a song's YouTube track (a visible player in the console; the screens keep
   * the lyrics).
   */
  youTube: boolean;
};

/** How far the timeline may be from what the console's YouTube player is really playing. */
const SOUND_DRIFT_S = 0.08;

/** A track from an uploaded file: the room's audio element plays it. */
const inRoom = (playback: Playback | null) => playback?.kind === "track" && !playback.youTube;

/** A screen that stopped sending its heartbeat for this long is gone. */
const SCREEN_TIMEOUT_MS = 6000;
/** Signed URLs last an hour: renew a little before. */
const REFRESH_URLS_EVERY_MS = 45 * 60 * 1000;

export function useLiveConsole(data: ConsoleData) {
  const [items, setItems] = useState(data.items);
  const [backgrounds, setBackgrounds] = useState(data.backgrounds);
  const [openKey, setOpenKey] = useState<string | null>(data.items[0]?.planItemId ?? null);
  const [live, setLive] = useState<LivePosition | null>(null);
  const [isCleared, setIsCleared] = useState(false);
  const [backgroundId, setBackgroundId] = useState<string | null>(() => {
    const id = data.projection.defaultBackgroundId;
    return id && data.backgrounds.some((background) => background.id === id) ? id : null;
  });
  const [playback, setPlayback] = useState<Playback | null>(null);
  // How the lyrics look (contract §6): the church's, changed live from "Texto".
  const [typography, setTypography] = useState<ProjectionTypography>(() => ({
    fontFamily: data.projection.fontFamily,
    fontSizePt: data.projection.fontSizePt,
    fontBold: data.projection.fontBold ?? false,
    fontItalic: data.projection.fontItalic ?? false,
    uppercase: data.projection.uppercase ?? false,
  }));
  const [screens, setScreens] = useState<
    Record<string, { lastSeen: number; width: number; height: number; ready: string[] }>
  >({});
  const [room] = useState(() => new RoomAudio());

  // A passage shown from "Biblia" (V): straight to the screens, never in the service.
  const [quickPassage, setQuickPassage] = useState<ConsoleItem | null>(null);
  const itemByKey = useMemo(
    () =>
      new Map(
        [...items, ...(quickPassage ? [quickPassage] : [])].map((item) => [item.planItemId, item]),
      ),
    [items, quickPassage],
  );
  const openItem = openKey ? (itemByKey.get(openKey) ?? null) : null;
  const background = backgrounds.find((candidate) => candidate.id === backgroundId) ?? null;

  // ----- What the screens show (IRIS_SPEC §7.3) -----

  const liveContent = useMemo<ProjectionContent>(() => {
    if (isCleared || !live) return { kind: "blank" };
    const item = itemByKey.get(live.key);
    if (!item) return { kind: "blank" };
    if (item.kind === "song" || item.kind === "bible") {
      const slide = item.slides[live.slide];
      return slide
        ? { kind: "text", text: slide.text, footnote: slide.footnote ?? null }
        : { kind: "blank" };
    }
    if (item.kind === "image" && item.file)
      return { kind: "image", id: item.file.id, url: item.file.url };
    if (item.kind === "video" && item.file) {
      const state = playback?.key === item.planItemId ? playback : null;
      return {
        kind: "video",
        id: item.file.id,
        url: item.file.url,
        playing: state?.playing ?? false,
        position: state?.position ?? 0,
        at: state?.at ?? 0,
      };
    }
    if (item.kind === "youtube" && item.youTubeId) {
      const state = playback?.key === item.planItemId ? playback : null;
      return {
        kind: "youtube",
        id: item.youTubeId,
        playing: state?.playing ?? false,
        position: state?.position ?? 0,
        at: state?.at ?? 0,
        captions: state?.captions ?? false,
      };
    }
    return { kind: "blank" };
  }, [isCleared, live, itemByKey, playback]);

  const liveFrame = useMemo<ProjectionFrame>(
    () => ({
      background,
      content: liveContent,
      typography,
    }),
    [background, liveContent, typography],
  );

  // ----- Talking to the screens -----

  /**
   * A player says where its video really is: its real length, and its end. The one with the
   * sound (YouTube in this console) is also the clock: when it runs late (it buffered) the
   * timeline moves to it, and the screens follow, so picture and sound stay together.
   */
  const followVideo = useCallback(
    (fileId: string, position: number, duration: number, isSound = false) => {
      setPlayback((current) => {
        if (!current || (current.kind !== "video" && !current.youTube)) return current;
        if (current.fileId !== fileId || !duration) return current;
        if (isSound && current.youTube && current.playing && position < duration - 0.25) {
          const now = Date.now();
          if (Math.abs(elapsedOf(current, now) - position) > SOUND_DRIFT_S) {
            return { ...current, duration, position, at: now };
          }
        }
        if (current.playing && position >= duration - 0.25) {
          // The end: again from 0 when repeating; otherwise it stops and the screen keeps only the
          // background (a track leaves the lyrics where they are).
          if (current.loop) return { ...current, duration, position: 0, at: Date.now() };
          if (current.kind === "video") setLive((now) => (now?.key === current.key ? null : now));
          return null;
        }
        return Math.abs(duration - current.duration) > 0.5 ? { ...current, duration } : current;
      });
    },
    [],
  );

  const channel = useRef<ReturnType<typeof consoleChannel> | null>(null);
  const seq = useRef(0);
  const preload = useMemo(
    () => preloadOf(quickPassage ? [...items, quickPassage] : items, backgrounds),
    [items, quickPassage, backgrounds],
  );
  const preloadKey = JSON.stringify(preload);
  // Linked TVs (contract §18) follow the same frame over the internet.
  const remote = useRemoteDisplays(data.displays, liveFrame, preload);
  // What a screen that says hello gets; kept current after each render.
  const latest = useRef({ frame: liveFrame, preload });
  useEffect(() => {
    latest.current = { frame: liveFrame, preload };
  }, [liveFrame, preload]);

  useEffect(() => {
    const opened = consoleChannel(data.churchId);
    channel.current = opened;
    const stop = opened.listen((message) => {
      if (message.type === "hello") {
        // A screen that just opened gets everything at once.
        opened.send({ type: "preload", files: latest.current.preload });
        opened.send({ type: "frame", seq: seq.current, frame: latest.current.frame });
        setScreens((current) => ({
          ...current,
          [message.screenId]: { lastSeen: Date.now(), width: 0, height: 0, ready: [] },
        }));
      } else if (message.type === "alive") {
        setScreens((current) => ({
          ...current,
          [message.screenId]: {
            lastSeen: Date.now(),
            width: message.width,
            height: message.height,
            ready: message.ready,
          },
        }));
      } else if (message.type === "files") {
        setScreens((current) =>
          current[message.screenId]
            ? {
                ...current,
                [message.screenId]: { ...current[message.screenId], ready: message.ready },
              }
            : current,
        );
      } else if (message.type === "bye") {
        setScreens(({ [message.screenId]: _gone, ...rest }) => rest);
      } else if (message.type === "videoTime") {
        followVideo(message.id, message.position, message.duration);
      }
    });
    // Screens that were already open hear this console starting.
    opened.send({ type: "preload", files: latest.current.preload });
    opened.send({ type: "frame", seq: 0, frame: latest.current.frame });
    const sweep = setInterval(() => {
      const now = Date.now();
      setScreens((current) => {
        const alive = Object.entries(current).filter(
          ([, screen]) => now - screen.lastSeen < SCREEN_TIMEOUT_MS,
        );
        return alive.length === Object.keys(current).length ? current : Object.fromEntries(alive);
      });
    }, 2000);
    return () => {
      clearInterval(sweep);
      stop();
      opened.close();
    };
  }, [data.churchId, followVideo]);

  useEffect(() => {
    seq.current += 1;
    channel.current?.send({ type: "frame", seq: seq.current, frame: liveFrame });
  }, [liveFrame]);

  useEffect(() => {
    channel.current?.send({ type: "preload", files: JSON.parse(preloadKey) as typeof preload });
  }, [preloadKey]);

  // ----- Signed URLs outlive the service -----

  useEffect(() => {
    const timer = setInterval(async () => {
      const ids = [
        ...items.flatMap((item) => (item.file ? [item.file.id] : [])),
        ...backgrounds.filter((b) => b.imageUrl || b.videoUrl).map((b) => b.id),
      ];
      if (ids.length === 0) return;
      const urls = await refreshFileUrls(ids);
      setItems((current) =>
        current.map((item) =>
          item.file && urls[item.file.id]
            ? { ...item, file: { ...item.file, url: urls[item.file.id] } }
            : item,
        ),
      );
      setBackgrounds((current) =>
        current.map((b) =>
          urls[b.id]
            ? { ...b, ...(b.videoUrl ? { videoUrl: urls[b.id] } : { imageUrl: urls[b.id] }) }
            : b,
        ),
      );
    }, REFRESH_URLS_EVERY_MS);
    return () => clearInterval(timer);
  }, [items, backgrounds]);

  // ----- Playback (IRIS_SPEC §7.4) -----

  // Playing has side effects (the audio element), so the controls read the current playback
  // from a ref and touch the player exactly once, outside the state updates.
  const playbackRef = useRef(playback);
  useEffect(() => {
    playbackRef.current = playback;
  }, [playback]);

  const commit = useCallback((next: Playback | null) => {
    playbackRef.current = next;
    setPlayback(next);
  }, []);

  const stopPlayback = useCallback(() => {
    const current = playbackRef.current;
    if (!current) return;
    room.pause();
    // A stopped video that was on the screens leaves only the background.
    if (current.kind === "video") setLive((now) => (now?.key === current.key ? null : now));
    commit(null);
  }, [commit, room]);

  const startPlayback = useCallback(
    (item: ConsoleItem) => {
      const fileId = item.youTubeId ?? item.file?.id;
      if (!fileId) return;
      const current = playbackRef.current;
      // A YouTube video plays on the screens like a video; its sound comes from EN VIVO here.
      const kind = item.kind === "video" || item.kind === "youtube" ? "video" : "track";
      // Presenting what is already loaded resumes it, never restarts.
      if (current?.key === item.planItemId) {
        if (current.playing) return;
        if (inRoom(current)) room.resume();
        commit({ ...current, playing: true, at: Date.now() });
        return;
      }
      if (current?.kind === "track") room.pause();
      if (kind === "track" && item.file) room.start(item.file.url);
      commit({
        key: item.planItemId,
        kind,
        fileId,
        title: item.title,
        playing: true,
        position: 0,
        at: Date.now(),
        duration: item.file?.durationSeconds ?? 0,
        loop: false,
        captions: item.kind === "youtube" ? false : null,
        youTube: item.youTubeId !== undefined,
      });
    },
    [commit, room],
  );

  const togglePlay = useCallback(() => {
    const current = playbackRef.current;
    if (!current) return;
    const now = Date.now();
    if (current.playing) {
      if (inRoom(current)) room.pause();
      commit({ ...current, playing: false, position: elapsedOf(current, now), at: now });
      return;
    }
    if (inRoom(current)) room.resume();
    // A paused video resumes on the screens.
    if (current.kind === "video") {
      setLive({ key: current.key, slide: 0 });
      setIsCleared(false);
    }
    commit({ ...current, playing: true, at: now });
  }, [commit, room]);

  const seek = useCallback(
    (seconds: number) => {
      const current = playbackRef.current;
      if (!current) return;
      if (inRoom(current)) room.seek(seconds);
      commit({ ...current, position: seconds, at: Date.now() });
    },
    [commit, room],
  );

  const toggleLoop = useCallback(() => {
    const current = playbackRef.current;
    if (!current) return;
    if (inRoom(current)) room.setLoop(!current.loop);
    commit({ ...current, loop: !current.loop });
  }, [commit, room]);

  const toggleCaptions = useCallback(() => {
    const current = playbackRef.current;
    if (current?.captions === null || !current) return;
    commit({ ...current, captions: !current.captions });
  }, [commit]);

  // The track's real length and its end come from the room's audio; the video's from the screen.
  useEffect(() => {
    const stop = room.listen({
      onDuration: (seconds) => {
        const current = playbackRef.current;
        if (current && inRoom(current) && seconds > 0) commit({ ...current, duration: seconds });
      },
      onEnded: () => {
        if (inRoom(playbackRef.current)) commit(null);
      },
      onError: () => toast.error("No pudimos reproducir la pista."),
    });
    return () => {
      stop();
      room.pause();
    };
  }, [room, commit]);

  // ----- Presenting (IRIS_SPEC §7.1–7.2) -----

  /** Puts a slide (or an image/video) on the screens. A video that was playing pauses; a track keeps going. */
  const show = useCallback((position: LivePosition) => {
    setPlayback((current) =>
      current?.kind === "video" && current.key !== position.key && current.playing
        ? { ...current, playing: false, position: elapsedOf(current, Date.now()), at: Date.now() }
        : current,
    );
    setLive(position);
    setIsCleared(false);
  }, []);

  /** "Biblia": the verse goes on the screens at once; the arrows move through its chapter. */
  const presentPassage = useCallback(
    (item: ConsoleItem, slide: number) => {
      setQuickPassage(item);
      setOpenKey(item.planItemId);
      show({ key: item.planItemId, slide });
    },
    [show],
  );

  /**
   * Library "doble clic" on an image, video or YouTube link: straight to the screens, without
   * adding it to the service (unless it is already there). Videos and YouTube start playing.
   */
  const presentQuick = useCallback(
    async (entry: LibraryEntry) => {
      let item = items.find((candidate) => candidate.refId === entry.id) ?? null;
      if (!item) {
        const result = await quickItem(entry.kind === "youtube" ? "youtube" : "media", entry.id);
        if (!result.item) {
          toast.error(result.error ?? "No pudimos mostrarlo.");
          return;
        }
        item = result.item;
        setQuickPassage(item);
      }
      setOpenKey(item.planItemId);
      show({ key: item.planItemId, slide: 0 });
      if (item.kind === "video" || item.kind === "youtube") startPlayback(item);
    },
    [items, show, startPlayback],
  );

  const presentSlide = useCallback(
    (index: number) => {
      if (openKey) show({ key: openKey, slide: index });
    },
    [openKey, show],
  );

  const presentMedia = useCallback(() => {
    if (!openItem) return;
    if (openItem.kind === "image") show({ key: openItem.planItemId, slide: 0 });
    if (openItem.kind === "video" || openItem.kind === "youtube") {
      show({ key: openItem.planItemId, slide: 0 });
      startPlayback(openItem);
    }
    if (openItem.kind === "track") startPlayback(openItem);
  }, [openItem, show, startPlayback]);

  /** "Pista" of a song with lyrics: plays or pauses it; the screens do not change. */
  const toggleTrack = useCallback(() => {
    if (!openItem?.file && !openItem?.youTubeId) return;
    if (playback?.key === openItem.planItemId) togglePlay();
    else startPlayback(openItem);
  }, [openItem, playback?.key, startPlayback, togglePlay]);

  /** ← / →: the slide before or after the one on the screens (or the first of the open song). */
  const step = useCallback(
    (offset: number) => {
      const key = live?.key ?? openKey;
      const item = key ? itemByKey.get(key) : null;
      if (!item || (item.kind !== "song" && item.kind !== "bible") || item.slides.length === 0) {
        return;
      }
      // Not on the screens yet: a passage starts at its first verse (or ends at its last).
      const before = item.focus ? item.focus.first - 1 : -1;
      const after = item.focus ? item.focus.last + 1 : item.slides.length;
      const current = live?.key === key ? live.slide : offset > 0 ? before : after;
      const next = Math.min(Math.max(current + offset, 0), item.slides.length - 1);
      if (key !== openKey) setOpenKey(key);
      show({ key: item.planItemId, slide: next });
    },
    [live, openKey, itemByKey, show],
  );

  // ----- Editing the service (IRIS_SPEC §7.6); the plan follows -----

  /** Adds to the end of the service, or at `index` when dropped between two rows. */
  const add = useCallback(
    async (kind: "song" | "media" | "bible" | "youtube", refId: string, index?: number) => {
      const result = await addToService(kind, refId);
      if (!result.item) {
        toast.error(result.error ?? "No pudimos agregarlo.");
        return;
      }
      const item = result.item;
      setItems((current) => {
        const at = Math.min(index ?? current.length, current.length);
        return [...current.slice(0, at), item, ...current.slice(at)];
      });
      setOpenKey(item.planItemId);
      if (index !== undefined) {
        void movePlanItem(item.planItemId, index).then(
          (moved) => moved.error && toast.error(moved.error),
        );
      }
    },
    [],
  );

  /** Takes rows out of this console: what was open moves on, what was playing stops. */
  const forget = useCallback(
    (keys: Set<string>) => {
      const index = items.findIndex((item) => keys.has(item.planItemId));
      if (index === -1) return;
      const rest = items.filter((item) => !keys.has(item.planItemId));
      setItems(rest);
      if (openKey && keys.has(openKey)) {
        setOpenKey(rest[Math.min(index, rest.length - 1)]?.planItemId ?? null);
      }
      if (playback && keys.has(playback.key)) stopPlayback();
      if (live && keys.has(live.key)) setLive(null);
    },
    [items, openKey, playback, live, stopPlayback],
  );

  const remove = useCallback(
    (key: string) => {
      const item = items.find((candidate) => candidate.planItemId === key);
      if (!item) return;
      forget(new Set([key]));
      void removePlanItem(key).then((result) => result.error && toast.error(result.error));
    },
    [items, forget],
  );

  /**
   * A song or file changed in the library (edited, or its track replaced): every row of it in
   * the service shows the new version.
   */
  const updateRef = useCallback((refId: string, content: Omit<ConsoleItem, "planItemId">) => {
    setItems((current) =>
      current.map((item) =>
        item.refId === refId ? { ...content, planItemId: item.planItemId } : item,
      ),
    );
  }, []);

  /** Deleted from the library: the API already took it out of the plan, so only here. */
  const dropRef = useCallback(
    (refId: string) =>
      forget(new Set(items.filter((item) => item.refId === refId).map((item) => item.planItemId))),
    [items, forget],
  );

  /** Drag and drop: the row `key` goes to place `to` (0-based), the others make room. */
  const moveTo = useCallback(
    (key: string, to: number) => {
      const from = items.findIndex((item) => item.planItemId === key);
      if (from === -1 || to < 0 || to >= items.length || to === from) return;
      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      setItems(next);
      void movePlanItem(key, to).then((result) => result.error && toast.error(result.error));
    },
    [items],
  );

  const clear = useCallback(() => {
    stopPlayback();
    setItems([]);
    setOpenKey(null);
    setLive(null);
    void clearPlan().then((result) => result.error && toast.error(result.error));
  }, [stopPlayback]);

  const connectedScreens = Object.values(screens);

  /**
   * Whether a file is already on the screens: "ready" on every connected one, "loading"
   * while any is still getting it, null without screens (nothing to show then).
   */
  const fileState = useCallback(
    (id: string): "ready" | "loading" | null => {
      if (connectedScreens.length === 0) return null;
      return connectedScreens.every((screen) => screen.ready.includes(id)) ? "ready" : "loading";
    },
    [connectedScreens],
  );

  /** A background uploaded from the console joins the list (and the screens preload it). */
  const addBackground = useCallback((added: ProjectionBackground) => {
    setBackgrounds((current) => [...current.filter((item) => item.id !== added.id), added]);
  }, []);

  /** A deleted background leaves the list; if it was showing, the screens go black. */
  const removeBackground = useCallback((id: string) => {
    setBackgrounds((current) => current.filter((item) => item.id !== id));
    setBackgroundId((current) => (current === id ? null : current));
  }, []);

  return {
    presentPassage,
    presentQuick,
    addBackground,
    removeBackground,
    typography,
    setTypography,
    updateRef,
    dropRef,
    remote,
    items,
    openItem,
    openKey,
    setOpenKey,
    live,
    liveFrame,
    isCleared,
    toggleCleared: () => setIsCleared((value) => !value),
    backgrounds,
    backgroundId,
    setBackgroundId,
    playback,
    togglePlay,
    seek,
    toggleLoop,
    toggleCaptions,
    stopPlayback,
    presentSlide,
    presentMedia,
    toggleTrack,
    step,
    add,
    followVideo,
    remove,
    moveTo,
    clear,
    screens: connectedScreens,
    fileState,
  };
}

export type LiveConsole = ReturnType<typeof useLiveConsole>;

export function elapsedOf(playback: Playback, now: number): number {
  const elapsed = playback.playing
    ? playback.position + (now - playback.at) / 1000
    : playback.position;
  return playback.duration > 0 ? Math.min(elapsed, playback.duration) : elapsed;
}

/** The files the screens should already have: the service's images and videos, and every background. */
function preloadOf(items: ConsoleItem[], backgrounds: ProjectionBackground[]): PreloadFile[] {
  const files = new Map<string, PreloadFile>();
  for (const item of items) {
    if (item.kind === "image" && item.file)
      files.set(item.file.id, { id: item.file.id, url: item.file.url, kind: "image" });
    if (item.kind === "video" && item.file)
      files.set(item.file.id, { id: item.file.id, url: item.file.url, kind: "video" });
  }
  for (const background of backgrounds) {
    if (background.imageUrl)
      files.set(background.id, { id: background.id, url: background.imageUrl, kind: "image" });
    if (background.videoUrl)
      files.set(background.id, {
        id: background.id,
        url: background.videoUrl,
        kind: "backgroundVideo",
      });
  }
  return [...files.values()];
}
