// The TV's own disk (Cache Storage): the files it downloaded stay there by media id, so
// turning the TV off and on does not download them again. The id never changes for a
// file (a new upload is a new id) while its signed URL does every hour, so the id is the key.
// Everything here is a convenience: without Cache Storage, or when it is full, the screen
// keeps its files in memory only, as before.

const CACHE_NAME = "iris-display-files-v1";
const PREFIX = "/__iris-file/";

async function open(): Promise<Cache | null> {
  try {
    return typeof caches === "undefined" ? null : await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
}

export async function readStoredFile(id: string): Promise<Blob | null> {
  try {
    const response = await (await open())?.match(`${PREFIX}${encodeURIComponent(id)}`);
    return response ? await response.blob() : null;
  } catch {
    return null;
  }
}

/** Best effort: a full disk (quota) or no support just means it is downloaded next time. */
export async function storeFile(id: string, blob: Blob): Promise<void> {
  try {
    await (
      await open()
    )?.put(
      `${PREFIX}${encodeURIComponent(id)}`,
      new Response(blob, { headers: { "Content-Type": blob.type } }),
    );
  } catch {
    // Not stored.
  }
}

/** Frees the files nobody asks for anymore (a deleted background, a past service's image). */
export async function pruneStoredFiles(keep: ReadonlySet<string>): Promise<void> {
  try {
    const cache = await open();
    if (!cache) return;
    for (const request of await cache.keys()) {
      const id = decodeURIComponent(new URL(request.url).pathname.slice(PREFIX.length));
      if (!keep.has(id)) await cache.delete(request);
    }
  } catch {
    // Left for next time.
  }
}

/** Asks the browser not to clear the stored files when it runs low on space. */
export function requestPersistentStorage(): void {
  try {
    void navigator.storage?.persist?.();
  } catch {
    // Not supported.
  }
}
