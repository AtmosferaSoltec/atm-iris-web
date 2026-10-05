import { z } from "zod";
import { LYRICS_LIMITS, parseLyrics } from "@/lib/lyrics";

export const SONG_FIELDS = ["title", "author", "lyrics"] as const;
export type SongField = (typeof SONG_FIELDS)[number];

export const IMPORT_LIMITS = { maxFiles: 50, maxFileBytes: 100_000 } as const;

const title = z
  .string()
  .trim()
  .min(1, "Escribe el título de la canción.")
  .max(120, "Usa un título más corto.");
const author = z.string().trim().max(120, "Usa un nombre más corto.");
const lyrics = z
  .string()
  .max(20_000, "La letra es demasiado larga.")
  .transform((value) => parseLyrics(value))
  .refine(
    (sections) => sections.length > 0,
    "Pega la letra: separa cada diapositiva con una línea en blanco.",
  )
  .refine(
    (sections) => sections.length <= LYRICS_LIMITS.maxSections,
    `Usa como máximo ${LYRICS_LIMITS.maxSections} diapositivas.`,
  );

/** Parses the editor form into what the repository stores. */
export const songFormSchema = z
  .object({ title, author, lyrics })
  .transform(({ lyrics: sections, ...rest }) => ({ ...rest, sections }));

export const importSongsSchema = z
  .array(
    z
      .object({ title, author, lyrics })
      .transform(({ lyrics: sections, ...rest }) => ({ ...rest, sections })),
  )
  .min(1, "Elige al menos un archivo.")
  .max(IMPORT_LIMITS.maxFiles, `Importa como máximo ${IMPORT_LIMITS.maxFiles} canciones a la vez.`);

export type ImportSongItem = { title: string; author: string; lyrics: string };
