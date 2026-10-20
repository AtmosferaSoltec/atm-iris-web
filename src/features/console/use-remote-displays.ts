"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Display } from "@/domain/models";
import type { PreloadFile } from "@/features/projection/channel";
import type { ProjectionFrame } from "@/features/projection/model";
import { listDisplays } from "./actions";

/** How often the console asks which TVs are on. */
const POLL_MS = 10_000;
/** A send that failed (no internet for a moment) goes again after this. */
const RETRY_MS = 2000;

type Outgoing = { frame?: ProjectionFrame; preload?: PreloadFile[] };

/**
 * Sends to the TVs (contract §18) one request at a time. Changes that pile up while one is
 * on its way travel together in the next, newest first: arrows held down never queue up.
 */
class DisplaySender {
  private pending: Outgoing | null = null;
  private busy = false;

  push(part: Outgoing) {
    this.pending = { ...this.pending, ...part };
    void this.flush();
  }

  private async flush(): Promise<void> {
    if (this.busy || !this.pending) return;
    this.busy = true;
    const sent = this.pending;
    this.pending = null;
    const ok = await fetch("/api/display/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...sent, clock: Date.now() }),
    })
      .then((response) => response.ok)
      .catch(() => false);
    this.busy = false;
    if (ok) {
      void this.flush();
      return;
    }
    // Newer changes win over the ones that failed.
    this.pending = { ...sent, ...(this.pending ?? {}) };
    setTimeout(() => void this.flush(), RETRY_MS);
  }
}

/** The church's linked TVs: what they show follows the console while there is any. */
export function useRemoteDisplays(
  initial: Display[],
  frame: ProjectionFrame,
  preload: PreloadFile[],
) {
  const [displays, setDisplays] = useState(initial);
  const [sender] = useState(() => new DisplaySender());
  const latest = useRef({ frame, preload });
  useEffect(() => {
    latest.current = { frame, preload };
  }, [frame, preload]);

  const hasDisplays = displays.length > 0;
  const preloadKey = JSON.stringify(preload);
  const onlineKey = displays
    .filter((display) => display.online)
    .map((display) => display.id)
    .join(",");

  const refresh = useCallback(async () => setDisplays(await listDisplays()), []);

  useEffect(() => {
    if (!hasDisplays) return;
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [hasDisplays, refresh]);

  useEffect(() => {
    if (hasDisplays) sender.push({ frame });
  }, [frame, hasDisplays, sender]);

  useEffect(() => {
    if (hasDisplays) sender.push({ preload: JSON.parse(preloadKey) as PreloadFile[] });
  }, [preloadKey, hasDisplays, sender]);

  // A TV that just came on (or an API that restarted) gets everything again.
  useEffect(() => {
    if (onlineKey) sender.push(latest.current);
  }, [onlineKey, sender]);

  return {
    displays,
    refresh,
    /** Just linked: it opens its channel within seconds, so look again soon. */
    added: (display: Display) => {
      setDisplays((current) => [...current, display]);
      setTimeout(() => void refresh(), 3000);
    },
    removed: (id: string) =>
      setDisplays((current) => current.filter((display) => display.id !== id)),
  };
}
