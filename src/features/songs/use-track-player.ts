"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/toaster";
import type { MediaAsset } from "@/domain/models";
import { mediaDownloadUrl } from "@/features/media/actions";

export type PlayState = "idle" | "loading" | "playing";

/** Signed URLs last an hour; ask again a little before. */
const URL_TTL_MS = 50 * 60 * 1000;

/**
 * One `<audio>` for the page: playing a song's track stops the one before.
 * Download URLs are asked for only when a track is played.
 */
export function useTrackPlayer() {
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

  async function toggle(track: Pick<MediaAsset, "id">) {
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

  /** Stops whatever is playing (e.g. the track was replaced or removed). */
  function stop() {
    audio.current?.pause();
    setCurrent(null);
  }

  const stateOf = (id: string): PlayState => (current?.id === id ? current.state : "idle");

  return { toggle, stop, stateOf };
}
