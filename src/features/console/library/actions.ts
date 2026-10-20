"use server";

import type { MediaAsset, Song } from "@/domain/models";
import type { YouTubeVideo } from "@/lib/youtube";
import { idSchema } from "@/lib/validation";
import { authorize } from "@/server/dal";
import { errorMessage } from "@/server/repositories/api/errors";
import { lookUpYouTube } from "@/server/youtube";
import { consoleItemFor } from "../load";
import type { ConsoleItem, LibraryEntry } from "../model";
import { mediaEntry, songEntry } from "./entries";

/** What a service row shows of a song or a file, without its place in the service. */
export type ItemContent = Omit<ConsoleItem, "planItemId">;

/** A song with its YouTube track's title, to open it in the editor. */
export async function songForEditing(
  id: string,
): Promise<{ song?: Song; youtube?: Omit<YouTubeVideo, "music">; error?: string }> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { error: "Revisa los datos enviados." };
  try {
    const { repos } = await authorize();
    const song = await repos.songs.get(parsed.data);
    if (!song) return { error: "Esa canción ya no existe." };
    const youtube = song.youtubeId ? await lookUpYouTube(song.youtubeId) : null;
    return { song, youtube: youtube?.video };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

/**
 * A song or a file as the console shows it now: its library row and, for the service, its
 * slides and files. `gone` when it no longer exists (deleted).
 */
export async function libraryItem(
  kind: "song" | "media",
  id: string,
): Promise<{ entry?: LibraryEntry; content?: ItemContent; gone?: boolean; error?: string }> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { error: "Revisa los datos enviados." };
  try {
    const { repos } = await authorize();
    if (kind === "song") {
      const song = await repos.songs.get(parsed.data);
      if (!song) return { gone: true };
      const item = await consoleItemFor(repos, "song", song.id, "");
      return {
        entry: songEntry({ ...song, sectionCount: song.sections.length }),
        content: item ? withoutPlace(item) : undefined,
      };
    }
    const asset = await repos.media.get(parsed.data);
    if (!asset) return { gone: true };
    const item = await consoleItemFor(repos, "media", asset.id, "");
    const previewUrl = await repos.media
      .downloadUrl(asset.id)
      .then((download) => download.url)
      .catch(() => null);
    return { entry: mediaEntry(asset, previewUrl), content: item ? withoutPlace(item) : undefined };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

function withoutPlace({ planItemId: _planItemId, ...content }: ConsoleItem): ItemContent {
  return content;
}

/** A file with a signed URL, to preview and edit it. */
export async function mediaFile(
  id: string,
): Promise<{ asset?: MediaAsset; url?: string | null; error?: string }> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { error: "Revisa los datos enviados." };
  try {
    const { repos } = await authorize();
    const asset = await repos.media.get(parsed.data);
    if (!asset) return { error: "Ese archivo ya no existe." };
    const url = await repos.media
      .downloadUrl(asset.id)
      .then((download) => download.url)
      .catch(() => null);
    return { asset, url };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}
