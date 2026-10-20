"use server";

import { revalidatePath } from "next/cache";
import { fieldErrorsFrom, formValues, GENERIC_ERROR, type FormState } from "@/lib/form-state";
import { idSchema } from "@/lib/validation";
import { isYouTubeMusicLink, youTubeVideoId, type YouTubeVideo } from "@/lib/youtube";
import { authorize } from "@/server/dal";
import { errorMessage, toFormState } from "@/server/repositories/api/errors";
import { searchLyrics, type FoundLyrics } from "@/server/lyrics";
import { lookUpYouTube } from "@/server/youtube";
import {
  lyricsSearchSchema,
  SONG_FIELDS,
  songFormSchema,
  songImportSchema,
  trackSongSchema,
  youTubeLinkSchema,
  type SongExportItem,
  type SongField,
} from "./schemas";

function revalidateSongs() {
  revalidatePath("/songs", "layout");
  revalidatePath("/settings");
  revalidatePath("/");
}

/** Creates (`songId` null) or replaces a song from the editor form. */
export async function saveSong(
  songId: string | null,
  _prev: FormState<SongField>,
  formData: FormData,
): Promise<FormState<SongField>> {
  const values = formValues(formData, SONG_FIELDS);
  const parsed = songFormSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };
  }
  const id = songId === null ? null : idSchema.safeParse(songId);
  if (id && !id.success) return { status: "error", message: GENERIC_ERROR, values };

  try {
    const { repos } = await authorize();
    if (id) await repos.songs.update(id.data, parsed.data);
    else await repos.songs.create(parsed.data);
  } catch (error) {
    // `sections.3.text` and the like have no field of their own: they go to the lyrics.
    return toFormState(error, SONG_FIELDS, { values, aliases: { sections: "lyrics" } });
  }
  revalidateSongs();
  return { status: "success" };
}

/** "Buscar letra": lyrics from LRCLIB, a free lyrics database (no key). */
export async function findLyrics(
  title: string,
  artist: string,
): Promise<{ results?: FoundLyrics[]; error?: string }> {
  const parsed = lyricsSearchSchema.safeParse({ title, artist });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  await authorize();
  return searchLyrics(parsed.data.title, parsed.data.artist);
}

/** A pasted YouTube or YouTube Music link, checked: it exists and can play outside YouTube. */
export async function findYouTubeTrack(
  link: string,
): Promise<{ video?: YouTubeVideo; error?: string }> {
  const parsed = youTubeLinkSchema.safeParse(link);
  const videoId = parsed.success ? youTubeVideoId(parsed.data) : null;
  if (!videoId) return { error: "Ese enlace no es de YouTube ni de YouTube Music." };
  await authorize();
  const found = await lookUpYouTube(videoId);
  return found.video
    ? { video: { ...found.video, music: isYouTubeMusicLink(parsed.data!) } }
    : { error: found.error };
}

/** "Subir pistas": each uploaded file becomes a song with only that track. */
export async function createTrackSong(audioId: string, title: string): Promise<{ error?: string }> {
  const parsed = trackSongSchema.safeParse({ audioId, title });
  if (!parsed.success) return { error: GENERIC_ERROR };
  try {
    const { repos } = await authorize();
    await repos.songs.create({
      ...parsed.data,
      author: "",
      sections: [],
      youtubeId: null,
      youtubeMusic: false,
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidateSongs();
  return {};
}

export async function deleteSong(songId: string): Promise<{ error?: string }> {
  const id = idSchema.safeParse(songId);
  if (!id.success) return { error: GENERIC_ERROR };
  try {
    const { repos } = await authorize();
    await repos.songs.delete(id.data);
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidateSongs();
  return {};
}

/** Bulk delete for "select and delete at once". Best-effort: one failure doesn't stop the rest. */
export async function deleteSongs(songIds: string[]): Promise<{ deleted: number; failed: number }> {
  const parsed = songIds.map((id) => idSchema.safeParse(id)).filter((result) => result.success);
  const { repos } = await authorize();
  let deleted = 0;
  let failed = 0;
  for (const id of parsed) {
    try {
      await repos.songs.delete(id.data);
      deleted++;
    } catch {
      failed++;
    }
  }
  revalidateSongs();
  return { deleted, failed };
}

/**
 * The library's lyrics, full sections included, for "Exportar" to download as a file, with
 * their YouTube track. Songs that are only an uploaded track have nothing to export.
 */
export async function exportSongs(): Promise<{ songs?: SongExportItem[]; error?: string }> {
  try {
    const { repos } = await authorize();
    const summaries: { id: string }[] = [];
    let page = 1;
    while (true) {
      const result = await repos.songs.list({ page, limit: 100, sort: "title" });
      summaries.push(...result.data);
      if (result.data.length === 0 || page >= result.meta.totalPages) break;
      page++;
    }
    const full = await Promise.all(summaries.map((summary) => repos.songs.get(summary.id)));
    return {
      songs: full
        .filter((song) => song !== null)
        .filter((song) => song.sections.length > 0 || song.youtubeId !== null)
        .map((song) => ({
          title: song.title,
          author: song.author,
          sections: song.sections.map(({ label, text }) => ({ label, text })),
          youtubeId: song.youtubeId,
          youtubeMusic: song.youtubeMusic,
        })),
    };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

/** Creates one song per entry of an exported file. Best-effort: one bad song never stops the rest. */
export async function importSongs(
  data: unknown,
): Promise<{ imported: number; failed: number; error?: string }> {
  const parsed = songImportSchema.safeParse(data);
  if (!parsed.success) {
    return {
      imported: 0,
      failed: 0,
      error: "Ese archivo no tiene el formato de una exportación de letras.",
    };
  }
  const { repos } = await authorize();
  let imported = 0;
  let failed = 0;
  for (const song of parsed.data.songs) {
    try {
      await repos.songs.create({ ...song, audioId: null });
      imported++;
    } catch {
      failed++;
    }
  }
  revalidateSongs();
  return { imported, failed };
}
