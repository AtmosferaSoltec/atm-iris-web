import { z } from "zod";
import { idSchema } from "@/lib/validation";

/** Contract §8: 1–80 characters, unique by nameKey among the church's people. */
export const personNameSchema = z
  .string()
  .trim()
  .min(1, "Escribe un nombre.")
  .max(80, "Usa un nombre más corto.");

export const PERSON_DUPLICATE = "Ya existe una persona con ese nombre.";

export const personIdSchema = idSchema;
