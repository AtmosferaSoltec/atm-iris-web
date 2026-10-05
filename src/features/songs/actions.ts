"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fieldErrorsFrom, formValues, GENERIC_ERROR, type FormState } from "@/lib/form-state";
import { authorize } from "@/server/dal";
import {
  importSongsSchema,
  SONG_FIELDS,
  songFormSchema,
  type ImportSongItem,
  type SongField,
} from "./schemas";

/** Creates (`songId` null) or updates a song from the editor form. */
export async function saveSong(
  songId: string | null,
  _prev: FormState<SongField>,
  formData: FormData,
): Promise<FormState<SongField>> {
  const { repos } = await authorize();
  const values = formValues(formData, SONG_FIELDS);
  const parsed = songFormSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  try {
    if (songId) await repos.songs.update(songId, parsed.data);
    else await repos.songs.create(parsed.data);
  } catch (error) {
    console.error(error);
    return { status: "error", message: GENERIC_ERROR, values };
  }

  revalidatePath("/canciones");
  redirect("/canciones");
}

export async function deleteSong(songId: string): Promise<{ error?: string }> {
  const { repos } = await authorize();
  try {
    await repos.songs.delete(songId);
  } catch (error) {
    console.error(error);
    return { error: GENERIC_ERROR };
  }
  revalidatePath("/canciones");
  redirect("/canciones");
}

export async function importSongs(
  items: ImportSongItem[],
): Promise<{ created?: number; error?: string }> {
  const { repos } = await authorize();
  const parsed = importSongsSchema.safeParse(items);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  }
  try {
    const created = await repos.songs.createMany(parsed.data);
    revalidatePath("/canciones");
    return { created: created.length };
  } catch (error) {
    console.error(error);
    return { error: GENERIC_ERROR };
  }
}
