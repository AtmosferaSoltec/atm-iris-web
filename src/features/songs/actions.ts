"use server";

import { revalidatePath } from "next/cache";
import { fieldErrorsFrom, formValues, GENERIC_ERROR, type FormState } from "@/lib/form-state";
import { idSchema } from "@/lib/validation";
import { authorize } from "@/server/dal";
import { errorMessage, toFormState } from "@/server/repositories/api/errors";
import {
  SONG_FIELDS,
  songFormSchema,
  songImportSchema,
  type SongExportItem,
  type SongField,
} from "./schemas";

function revalidateSongs() {
  revalidatePath("/letras", "layout");
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

/** The whole library, full sections included, for "Exportar" to download as a file. */
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
        .map((song) => ({
          title: song.title,
          author: song.author,
          sections: song.sections.map(({ label, text }) => ({ label, text })),
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
      await repos.songs.create(song);
      imported++;
    } catch {
      failed++;
    }
  }
  revalidateSongs();
  return { imported, failed };
}
