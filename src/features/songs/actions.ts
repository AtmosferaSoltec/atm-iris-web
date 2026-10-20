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
  youTubeLinkSchema,
  type SongField,
} from "./schemas";

function revalidateSongs() {
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
    const saved = id
      ? await repos.songs.update(id.data, parsed.data)
      : await repos.songs.create(parsed.data);
    revalidateSongs();
    return { status: "success", savedId: saved.id };
  } catch (error) {
    // `sections.3.text` and the like have no field of their own: they go to the lyrics.
    return toFormState(error, SONG_FIELDS, { values, aliases: { sections: "lyrics" } });
  }
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
