import { z } from "zod";
import { isValidTimeZone } from "@/lib/zoned-time";

export const CHURCH_FIELDS = ["name", "timezone"] as const;
export type ChurchField = (typeof CHURCH_FIELDS)[number];

/** Contract §6: name 1–120, timezone a valid IANA zone. */
export const churchSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Escribe el nombre de la iglesia.")
    .max(120, "Usa un nombre más corto."),
  timezone: z.string().trim().refine(isValidTimeZone, "Elige una zona horaria de la lista."),
});

export const modulesSchema = z.object({
  bible: z.boolean(),
  multimedia: z.boolean(),
  timeControl: z.boolean(),
});
