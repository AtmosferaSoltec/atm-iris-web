import { z } from "zod";

/** The backup file: the API checks every field again; this only recognises the file. */
export const backupFileSchema = z.looseObject({
  format: z.literal("iris-backup", "Ese archivo no es un respaldo de Iris."),
  version: z.literal(1, "Esa versión del respaldo no se reconoce."),
  songs: z.array(z.any()).default([]),
  youtubeVideos: z.array(z.any()).default([]),
});

/** What to delete in bulk; the word is typed by hand so it is never an accident. */
export const eraseSchema = z
  .object({
    songs: z.boolean(),
    media: z.boolean(),
    youtube: z.boolean(),
    confirm: z.literal("ELIMINAR", "Escribe ELIMINAR para confirmar."),
  })
  .refine((value) => value.songs || value.media || value.youtube, "Elige qué eliminar.");
