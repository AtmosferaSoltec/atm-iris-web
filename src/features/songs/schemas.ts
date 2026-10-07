import { z } from "zod";
import { LYRICS_LIMITS, parseLyrics } from "@/lib/lyrics";

export const SONG_FIELDS = ["title", "author", "lyrics"] as const;
export type SongField = (typeof SONG_FIELDS)[number];

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
  )
  .refine(
    (sections) =>
      sections.every((section) => (section.label?.length ?? 0) <= LYRICS_LIMITS.maxLabelLength),
    `Un nombre de diapositiva (#…) tiene como máximo ${LYRICS_LIMITS.maxLabelLength} caracteres.`,
  );

const songSchema = z
  .object({ title, author, lyrics })
  .transform(({ lyrics: sections, ...rest }) => ({ ...rest, sections }));

/** Parses the editor form into the contract's `SongInput`. */
export const songFormSchema = songSchema;
