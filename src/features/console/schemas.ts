import { z } from "zod";
import { idSchema } from "@/lib/validation";

export { addPlanItemSchema as addToServiceSchema } from "@/features/service-plan/schemas";

/** Files whose signed URLs are about to expire (a service longer than an hour). */
export const refreshUrlsSchema = z.array(idSchema).max(200);

const isoDate = z.iso.datetime({ offset: true }).nullable();

/** `PUT /service-records/:id` (contract §14), as the console sends it while the service runs. */
export const serviceRecordSchema = z.object({
  status: z.enum(["inProgress", "finished"]),
  date: z.iso.datetime({ offset: true }),
  serviceTypeId: idSchema,
  serviceTypeName: z.string().trim().min(1).max(60),
  blocks: z
    .array(
      z.object({
        id: idSchema,
        name: z.string().trim().min(1).max(60),
        plannedSeconds: z.number().int().min(0),
        actualSeconds: z.number().int().min(0),
        personId: idSchema.nullable(),
        personName: z.string().trim().max(80).nullable(),
        status: z.enum(["pending", "running", "completed", "skipped"]),
        startedAt: isoDate,
        endedAt: isoDate,
      }),
    )
    .min(1)
    .max(60),
});

/** "Crear servicio" from the console: just a name and its blocks (contract §9). */
export const quickServiceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Escribe el nombre del servicio.")
    .max(60, "Usa un nombre más corto."),
  blocks: z
    .array(
      z.object({
        name: z
          .string()
          .trim()
          .min(1, "Escribe el nombre del bloque.")
          .max(60, "Usa un nombre más corto."),
        plannedMinutes: z.number().int().min(1, "Mínimo 1 minuto.").max(240, "Máximo 240 minutos."),
      }),
    )
    .min(1, "Agrega al menos un bloque.")
    .max(30, "Máximo 30 bloques."),
});

/** A YouTube link pasted in the console. */
export const youTubeLinkSchema = z.string().trim().min(1, "Pega el enlace del video.").max(500);

/** What the console sends its TVs (contract §18): passed along without reading it. */
export const displayStateSchema = z
  .object({
    frame: z.record(z.string(), z.unknown()).optional(),
    preload: z.array(z.record(z.string(), z.unknown())).max(500).optional(),
    clock: z.number().int().positive(),
    displayId: idSchema.optional(),
  })
  .refine((state) => state.frame || state.preload);

/** "Agregar pantalla": the code the screen shows and a name for it. */
export const claimDisplaySchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/, "El código tiene 6 letras y números."),
  name: z
    .string()
    .trim()
    .min(1, "Ponle un nombre, por ejemplo «TV del salón».")
    .max(60, "Usa un nombre más corto."),
});
