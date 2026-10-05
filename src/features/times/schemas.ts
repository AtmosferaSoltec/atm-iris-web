import { z } from "zod";
import { idSchema } from "@/lib/validation";

export const blockRefSchema = z.object({ recordId: idSchema, blockId: idSchema });

/** Contract §14: whole seconds ≥ 0. Twelve hours is plenty for one block. */
export const actualSecondsSchema = z
  .number()
  .int("Usa segundos enteros.")
  .min(0, "La duración no puede ser negativa.")
  .max(12 * 3600, "Revisa la duración: es demasiado larga.");

export const leaderSchema = idSchema.nullable();
export const recordIdSchema = idSchema;
