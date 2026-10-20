"use server";

import type { MediaAsset, Song } from "@/domain/models";
import type { YouTubeVideo } from "@/lib/youtube";
import { idSchema } from "@/lib/validation";
import { authorize } from "@/server/dal";
import { errorMessage } from "@/server/repositories/api/errors";
import { lookUpYouTube } from "@/server/youtube";
import { parseLyrics } from "@/lib/lyrics";
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

/** Out of the library: the lyrics stay, an uploaded track is deleted. */
export async function archiveSong(id: string): Promise<{ error?: string }> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { error: "Revisa los datos enviados." };
  try {
    const { repos } = await authorize();
    await repos.songs.archive(parsed.data);
    return {};
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

/** Back in the library. */
export async function unarchiveSong(id: string): Promise<{ entry?: LibraryEntry; error?: string }> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { error: "Revisa los datos enviados." };
  try {
    const { repos } = await authorize();
    const song = await repos.songs.unarchive(parsed.data);
    return { entry: songEntry({ ...song, sectionCount: song.sections.length }) };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

/** The archived songs, to see or bring back. */
export async function archivedSongs(): Promise<{ entries?: LibraryEntry[]; error?: string }> {
  try {
    const { repos } = await authorize();
    const page = await repos.songs.list({ archived: true, limit: 100, sort: "title" });
    return { entries: page.data.map(songEntry) };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

/**
 * Edits one slide of a song from the console: its text can be split into several slides with
 * a blank line. `before` is the text the console showed, to refuse an edit over a song that
 * changed meanwhile.
 */
export async function editSongSlide(
  songId: string,
  index: number,
  before: string,
  text: string,
): Promise<{ content?: ItemContent; error?: string }> {
  const id = idSchema.safeParse(songId);
  if (!id.success || !Number.isInteger(index) || index < 0 || text.length > 20_000) {
    return { error: "Revisa los datos enviados." };
  }
  const parts = parseLyrics(text);
  if (parts.length === 0) return { error: "Escribe el texto de la diapositiva." };
  try {
    const { repos } = await authorize();
    const song = await repos.songs.get(id.data);
    const current = song?.sections[index];
    if (!song || !current || current.text !== before) {
      return { error: "La canción cambió. Ciérrala y ábrela otra vez." };
    }
    const sections = song.sections.map(({ label, text: body }) => ({ label, text: body }));
    // The first part keeps the slide's name; the others start unnamed (unless they bring one).
    sections.splice(
      index,
      1,
      ...parts.map((part, position) => ({
        label: part.label ?? (position === 0 ? current.label : null),
        text: part.text,
      })),
    );
    await repos.songs.update(song.id, {
      title: song.title,
      author: song.author,
      sections,
      audioId: song.audio?.id ?? null,
      youtubeId: song.youtubeId,
      youtubeMusic: song.youtubeMusic,
    });
    const item = await consoleItemFor(repos, "song", song.id, "");
    return item ? { content: withoutPlace(item) } : { error: "No pudimos abrir la canción." };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}
