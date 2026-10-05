import { z } from "zod";
import { LYRICS_LIMITS, parseLyrics } from "@/lib/lyrics";

export const SONG_FIELDS = ["title", "author", "copyright", "lyrics"] as const;
export type SongField = (typeof SONG_FIELDS)[number];

/** Contract §10: `POST /songs/import` takes 1–50 songs. */
export const IMPORT_LIMITS = { maxFiles: 50, maxFileBytes: 100_000 } as const;

const title = z
  .string()
  .trim()
  .min(1, "Escribe el título de la canción.")
  .max(120, "Usa un título más corto.");
const author = z.string().trim().max(120, "Usa un nombre más corto.");
const copyright = z
  .string()
  .trim()
  .max(200, "Usa un texto más corto.")
  .transform((value) => value || null);
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

const songSchema = z
  .object({ title, author, copyright, lyrics })
  .transform(({ lyrics: sections, ...rest }) => ({ ...rest, sections }));

/** Parses the editor form into the contract's `SongInput`. */
export const songFormSchema = songSchema;

export const importSongsSchema = z
  .array(songSchema)
  .min(1, "Elige al menos un archivo.")
  .max(IMPORT_LIMITS.maxFiles, `Importa como máximo ${IMPORT_LIMITS.maxFiles} canciones a la vez.`);

export type ImportSongItem = { title: string; author: string; copyright: string; lyrics: string };
