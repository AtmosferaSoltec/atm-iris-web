import { z } from "zod";
import { BLOCK_MINUTES, SERVICE_PALETTE } from "@/domain/rules";

export const BLOCKS_REQUIRED = "Agrega al menos un bloque o desactiva el control de tiempo.";

const paletteValues = SERVICE_PALETTE.map((color) => color.value) as [string, ...string[]];

export const serviceTypeDraftSchema = z
  .object({
    id: z.string().min(1).nullable(),
    name: z
      .string()
      .trim()
      .min(1, "Escribe el nombre del servicio.")
      .max(60, "Usa un nombre más corto."),
    color: z.enum(paletteValues),
    schedule: z
      .object({
        weekday: z.number().int().min(1).max(7),
        hour: z.number().int().min(0).max(23),
        minute: z.number().int().min(0).max(59),
      })
      .nullable(),
    tracksTime: z.boolean(),
    blocks: z
      .array(
        z.object({
          id: z.string().min(1),
          name: z.string().trim().min(1, "Escribe el nombre del bloque.").max(60),
          plannedMinutes: z.number().int().min(BLOCK_MINUTES.min).max(BLOCK_MINUTES.max),
          defaultPersonId: z.string().min(1).nullable(),
        }),
      )
      .max(30),
  })
  .refine((draft) => !draft.tracksTime || draft.blocks.length > 0, {
    path: ["blocks"],
    message: BLOCKS_REQUIRED,
  });

export type ServiceTypeDraft = z.input<typeof serviceTypeDraftSchema>;

export type SaveServiceTypeResult = {
  error?: string;
  fieldErrors?: { name?: string; blocks?: string };
};
