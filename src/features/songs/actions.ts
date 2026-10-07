"use server";

import { revalidatePath } from "next/cache";
import { fieldErrorsFrom, formValues, GENERIC_ERROR, type FormState } from "@/lib/form-state";
import { idSchema } from "@/lib/validation";
import { authorize } from "@/server/dal";
import { errorMessage, toFormState } from "@/server/repositories/api/errors";
import type { SongImportResult } from "@/server/repositories/types";
import {
  importSongsSchema,
  SONG_FIELDS,
  songFormSchema,
  type ImportSongItem,
  type SongField,
} from "./schemas";

function revalidateSongs() {
  revalidatePath("/canciones", "layout");
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

/** The server decides what is a duplicate; the dialog only warns beforehand. */
export async function importSongs(
  items: ImportSongItem[],
): Promise<{ result?: SongImportResult; error?: string }> {
  const parsed = importSongsSchema.safeParse(items);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  try {
    const { repos } = await authorize();
    const result = await repos.songs.import(parsed.data);
    revalidateSongs();
    return { result };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

/** Every title in the library, to warn about duplicates before importing. */
export async function listSongTitles(): Promise<string[]> {
  const { repos } = await authorize();
  const titles: string[] = [];
  for (let page = 1; ; page += 1) {
    const { data, meta } = await repos.songs.list({ page, limit: 100 });
    titles.push(...data.map((song) => song.title));
    if (page >= meta.totalPages) return titles;
  }
}
