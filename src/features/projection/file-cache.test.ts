import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PreloadFile } from "./channel";
import { FileCache } from "./file-cache";

/** Cache Storage in memory: the key is the path the store uses. */
function stubDisk() {
  const disk = new Map<string, Response>();
  const cache = {
    match: async (key: string) => disk.get(key)?.clone(),
    put: async (key: string, response: Response) => void disk.set(key, response),
    keys: async () => [...disk.keys()].map((key) => ({ url: `https://iris.test${key}` })),
    delete: async (request: { url: string }) => disk.delete(new URL(request.url).pathname),
  };
  vi.stubGlobal("caches", { open: async () => cache });
  return disk;
}

const file = (id: string, kind: PreloadFile["kind"] = "backgroundVideo"): PreloadFile => ({
  id,
  url: `https://r2.test/${id}`,
  kind,
});

const body = () => new Response(new Blob(["bytes"], { type: "video/mp4" }));

function newCache() {
  // What a screen keeps as state: the files still on their way, as the cache last said.
  let pending: ReadonlySet<string> = new Set();
  const onChange = vi.fn((next: ReadonlySet<string>) => {
    pending = next;
  });
  const cache = new FileCache(onChange);
  const ready = vi.fn();
  cache.listen(ready);
  return { cache, onChange, ready, isPending: (id: string) => pending.has(id) };
}

describe("FileCache", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => body()),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("downloads a file once, keeps it on the disk and shows it from a local copy", async () => {
    const disk = stubDisk();
    const { cache, ready, isPending } = newCache();

    cache.announce([file("a")]);
    expect(isPending("a")).toBe(true);
    await vi.waitFor(() => expect(cache.readyIds()).toEqual(["a"]));

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(disk.has("/__iris-file/a")).toBe(true);
    expect(isPending("a")).toBe(false);
    expect(cache.resolve("a", "https://r2.test/a")).toMatch(/^blob:/);
    expect(ready).toHaveBeenLastCalledWith(["a"]);
  });

  it("after a restart it reads the disk and does not download again", async () => {
    stubDisk();
    const first = newCache();
    first.cache.announce([file("a")]);
    await vi.waitFor(() => expect(first.cache.readyIds()).toEqual(["a"]));
    first.cache.dispose();
    vi.mocked(fetch).mockClear();

    // The TV is switched off and on: a new page, the same disk.
    const second = newCache();
    second.cache.announce([file("a")]);
    await vi.waitFor(() => expect(second.cache.readyIds()).toEqual(["a"]));
    expect(fetch).not.toHaveBeenCalled();
  });

  it("downloads one file at a time, and the one the screen waits for goes next", async () => {
    stubDisk();
    const finish: Array<() => void> = [];
    vi.mocked(fetch).mockImplementation(
      () => new Promise<Response>((resolve) => finish.push(() => resolve(body()))),
    );
    const { cache } = newCache();

    cache.announce([file("a"), file("b"), file("c")]);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(vi.mocked(fetch).mock.calls[0]![0]).toBe("https://r2.test/a");

    cache.prioritize("c");
    finish[0]!();
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(vi.mocked(fetch).mock.calls[1]![0]).toBe("https://r2.test/c");
    finish[1]!();
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    expect(vi.mocked(fetch).mock.calls[2]![0]).toBe("https://r2.test/b");
  });

  it("retries a failed download, then gives up and lets the screen use the network", async () => {
    stubDisk();
    vi.useFakeTimers();
    vi.mocked(fetch).mockRejectedValue(new Error("offline"));
    const { cache, onChange, isPending } = newCache();

    cache.announce([file("a")]);
    await vi.advanceTimersByTimeAsync(0);
    expect(isPending("a")).toBe(true);

    for (const wait of [5_000, 15_000, 30_000, 60_000]) {
      await vi.advanceTimersByTimeAsync(wait);
    }

    expect(fetch).toHaveBeenCalledTimes(5);
    expect(isPending("a")).toBe(false);
    expect(cache.readyIds()).toEqual([]);
    expect(cache.resolve("a", "https://r2.test/a")).toBe("https://r2.test/a");
    expect(onChange).toHaveBeenCalled();
  });

  it("frees from the disk what the console no longer lists, but never on an empty list", async () => {
    const disk = stubDisk();
    const { cache } = newCache();
    cache.announce([file("a"), file("b")]);
    await vi.waitFor(() => expect(cache.readyIds()).toHaveLength(2));

    cache.announce([]);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect([...disk.keys()].sort()).toEqual(["/__iris-file/a", "/__iris-file/b"]);

    cache.announce([file("a")]);
    await vi.waitFor(() => expect([...disk.keys()]).toEqual(["/__iris-file/a"]));
  });
});
