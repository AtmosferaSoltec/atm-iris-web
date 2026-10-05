import { z } from "zod";

/** Ids come from the API (UUID v7) or the mocks; checked loosely, the API owns the format. */
export const idSchema = z.string().trim().min(1).max(64);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Escribe un correo.")
  .pipe(z.email("Ese correo no parece válido."));

/** Contract §5: 8–128 characters. */
export const newPasswordSchema = z
  .string()
  .min(1, "Escribe una contraseña.")
  .min(8, "Usa al menos 8 caracteres.")
  .max(128, "Usa como máximo 128 caracteres.");
