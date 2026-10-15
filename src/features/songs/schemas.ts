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

/** One song as it travels in an export/import file: same shape as `SongInput`. */
const songExportItemSchema = z.object({
  title: z.string().trim().min(1).max(120),
  author: z.string().trim().max(120).default(""),
  sections: z
    .array(
      z.object({
        label: z.string().trim().max(40).nullable(),
        text: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1)
    .max(80),
});

/** A whole library export: `{ songs: [...] }`. Up to 2000 so a bad paste can't hang the import. */
export const songImportSchema = z.object({
  songs: z.array(songExportItemSchema).min(1).max(2000),
});

export type SongExportItem = z.infer<typeof songExportItemSchema>;
