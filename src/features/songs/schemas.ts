import { z } from "zod";
import { LYRICS_LIMITS, parseLyrics } from "@/lib/lyrics";
import { idSchema } from "@/lib/validation";

export const SONG_FIELDS = ["title", "author", "lyrics", "audioId"] as const;
export type SongField = (typeof SONG_FIELDS)[number];

const title = z
  .string()
  .trim()
  .min(1, "Escribe el título de la canción.")
  .max(120, "Usa un título más corto.");
const author = z.string().trim().max(120, "Usa un nombre más corto.");
// Empty is fine when the song has a track (contract §10: lyrics, track or both).
const lyrics = z
  .string()
  .max(20_000, "La letra es demasiado larga.")
  .transform((value) => parseLyrics(value))
  .refine(
    (sections) => sections.length <= LYRICS_LIMITS.maxSections,
    `Usa como máximo ${LYRICS_LIMITS.maxSections} diapositivas.`,
  )
  .refine(
    (sections) =>
      sections.every((section) => (section.label?.length ?? 0) <= LYRICS_LIMITS.maxLabelLength),
    `Un nombre de diapositiva (#…) tiene como máximo ${LYRICS_LIMITS.maxLabelLength} caracteres.`,
  );
/** The uploaded track's id; empty when the song has none. */
const audioId = z
  .union([idSchema, z.literal("")])
  .optional()
  .transform((value) => value || null);

const songSchema = z
  .object({ title, author, lyrics, audioId })
  .superRefine((song, ctx) => {
    if (song.lyrics.length === 0 && song.audioId === null) {
      ctx.addIssue({
        code: "custom",
        path: ["lyrics"],
        message: "Pega la letra o sube una pista: separa cada diapositiva con una línea en blanco.",
      });
    }
  })
  .transform(({ lyrics: sections, ...rest }) => ({ ...rest, sections }));

/** Parses the editor form into the contract's `SongInput`. */
export const songFormSchema = songSchema;

/** A track uploaded on its own becomes a song with just that track, named after the file. */
export const trackSongSchema = z.object({ audioId: idSchema, title });

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

/**
 * A whole library export: `{ songs: [...] }`. Lyrics only: tracks are files and stay in
 * Iris. Up to 2000 so a bad paste can't hang the import.
 */
export const songImportSchema = z.object({
  songs: z.array(songExportItemSchema).min(1).max(2000),
});

export type SongExportItem = z.infer<typeof songExportItemSchema>;
