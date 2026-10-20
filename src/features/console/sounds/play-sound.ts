import { mediaDownloadUrl } from "@/features/media/actions";

// Sounds play from this computer, towards the speakers, like a song's track. Each one is
// downloaded ahead (when the panel opens) so a click sounds at once.

/** A signed URL lasts an hour; get a new one a little before. */
const FRESH_MS = 50 * 60 * 1000;

const cache = new Map<string, { audio: HTMLAudioElement; loadedAt: number }>();

async function load(id: string): Promise<HTMLAudioElement | null> {
  const cached = cache.get(id);
  if (cached && Date.now() - cached.loadedAt < FRESH_MS) return cached.audio;
  const { url } = await mediaDownloadUrl(id);
  if (!url) return null;
  const audio = new Audio(url);
  audio.preload = "auto";
  cache.set(id, { audio, loadedAt: Date.now() });
  return audio;
}

export function preloadSounds(ids: string[]) {
  for (const id of ids) void load(id);
}

export function forgetSound(id: string) {
  cache.get(id)?.audio.pause();
  cache.delete(id);
}

/** From the start, even if it is still playing from the last click. Returns false when it can't. */
export async function playSound(id: string): Promise<boolean> {
  const audio = await load(id);
  if (!audio) return false;
  try {
    audio.currentTime = 0;
    await audio.play();
    return true;
  } catch {
    return false;
  }
}
