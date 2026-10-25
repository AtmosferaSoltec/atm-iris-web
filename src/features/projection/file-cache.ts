import type { PreloadFile } from "./channel";
import { pruneStoredFiles, readStoredFile, storeFile } from "./file-store";

/** Waits between tries when a download fails (a weak connection drops now and then). */
const RETRY_MS = [5_000, 15_000, 30_000, 60_000];

type CachedFile = {
  /** The URL it was announced with, to tell a refreshed signed URL from a new file. */
  url: string;
  kind: PreloadFile["kind"];
  /** `blob:` URL once the whole file is here (images and background videos). */
  objectUrl: string | null;
  /** Detached element that keeps a service video buffered. */
  video: HTMLVideoElement | null;
  ready: boolean;
  /** Gave up downloading it: the canvas uses the network instead of waiting for it. */
  failed: boolean;
  attempts: number;
  retry: ReturnType<typeof setTimeout> | undefined;
  abort: AbortController;
};

/**
 * The screen's files, by media id. Images and background videos are downloaded whole,
 * one at a time (a weak connection is not shared among many), and kept on the TV's disk so
 * they survive a restart; a file is read from disk first and only downloaded when missing.
 * Once here it is shown from a `blob:` URL, never from the network. A service video (bigger)
 * is only buffered by a hidden player for as long as the page is open.
 */
export class FileCache {
  private files = new Map<string, CachedFile>();
  private queue: string[] = [];
  private priority: string | null = null;
  private isRunning = false;

  private onReadyChange: (ready: string[]) => void = () => undefined;

  /** Who hears the ids ready on this screen (the console is told which files this TV has). */
  readonly listen = (onReadyChange: (ready: string[]) => void): void => {
    this.onReadyChange = onReadyChange;
  };

  /**
   * `onChange` hears the files still on their way every time that set changes (a file
   * was announced, became ready, failed or was dropped). A screen keeps it as state:
   * it is what a render may depend on, not this object's inner fields.
   */
  constructor(private readonly onChange: (pending: ReadonlySet<string>) => void) {}

  private pendingIds(): ReadonlySet<string> {
    return new Set(
      [...this.files].filter(([, file]) => !file.ready && !file.failed).map(([id]) => id),
    );
  }

  readonly readyIds = (): string[] =>
    [...this.files].filter(([, file]) => file.ready).map(([id]) => id);

  /** The local copy when there is one, the network URL otherwise. */
  readonly resolve = (id: string, url: string): string => this.files.get(id)?.objectUrl ?? url;

  /** What is on the screen waits for this file: it goes next. */
  readonly prioritize = (id: string): void => {
    if (this.pendingIds().has(id)) this.priority = id;
  };

  readonly announce = (list: PreloadFile[]): void => {
    const announced = new Set(list.map((file) => file.id));
    for (const id of [...this.files.keys()]) {
      if (!announced.has(id)) this.drop(id);
    }
    for (const { id, url, kind } of list) {
      const existing = this.files.get(id);
      // A refreshed signed URL for a file already here changes nothing.
      if (existing && (existing.ready || existing.url === url)) continue;
      if (existing) this.drop(id);
      const file: CachedFile = {
        url,
        kind,
        objectUrl: null,
        video: null,
        ready: false,
        failed: false,
        attempts: 0,
        retry: undefined,
        abort: new AbortController(),
      };
      this.files.set(id, file);
      if (kind === "video") {
        const video = document.createElement("video");
        video.muted = true;
        video.preload = "auto";
        video.addEventListener("canplaythrough", () => this.markReady(id, file), { once: true });
        video.src = url;
        file.video = video;
      } else {
        this.queue.push(id);
      }
    }
    // An empty list is a console with nothing loaded yet, not an order to clear the disk.
    if (list.length > 0) {
      const kept = new Set(list.filter((file) => file.kind !== "video").map((file) => file.id));
      void pruneStoredFiles(kept);
    }
    this.onReadyChange(this.readyIds());
    this.onChange(this.pendingIds());
    void this.pump();
  };

  readonly dispose = (): void => {
    for (const id of [...this.files.keys()]) this.drop(id);
    this.queue = [];
  };

  private drop(id: string): void {
    const file = this.files.get(id);
    if (!file) return;
    file.abort.abort();
    clearTimeout(file.retry);
    if (file.objectUrl) URL.revokeObjectURL(file.objectUrl);
    if (file.video) {
      file.video.removeAttribute("src");
      file.video.load();
    }
    this.files.delete(id);
    this.queue = this.queue.filter((queued) => queued !== id);
  }

  private markReady(id: string, file: CachedFile): void {
    if (this.files.get(id) !== file) return;
    file.ready = true;
    this.onChange(this.pendingIds());
    this.onReadyChange(this.readyIds());
  }

  private nextId(): string | null {
    const priority = this.priority;
    if (priority && this.queue.includes(priority)) {
      this.priority = null;
      this.queue = this.queue.filter((queued) => queued !== priority);
      return priority;
    }
    return this.queue.shift() ?? null;
  }

  private async pump(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      for (let id = this.nextId(); id; id = this.nextId()) await this.load(id);
    } finally {
      this.isRunning = false;
    }
  }

  private async load(id: string): Promise<void> {
    const file = this.files.get(id);
    if (!file || file.ready || file.failed) return;
    const blob = await this.obtain(id, file);
    if (this.files.get(id) !== file) return; // dropped while it was downloading
    if (blob) {
      file.objectUrl = URL.createObjectURL(blob);
      this.markReady(id, file);
      return;
    }
    file.attempts += 1;
    const wait = RETRY_MS[file.attempts - 1];
    if (wait === undefined) {
      file.failed = true;
      this.onChange(this.pendingIds());
      return;
    }
    file.retry = setTimeout(() => {
      if (this.files.get(id) !== file) return;
      this.queue.push(id);
      void this.pump();
    }, wait);
  }

  /** From the disk when it is there; otherwise downloaded (and kept on the disk for next time). */
  private async obtain(id: string, file: CachedFile): Promise<Blob | null> {
    const stored = await readStoredFile(id);
    if (stored) return stored;
    try {
      const response = await fetch(file.url, { signal: file.abort.signal });
      if (!response.ok) return null;
      const blob = await response.blob();
      void storeFile(id, blob);
      return blob;
    } catch {
      return null;
    }
  }
}
