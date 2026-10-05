import { z } from "zod";
import { MEDIA_KINDS } from "@/domain/media-rules";
import type { MediaKind } from "@/domain/models";
import { idSchema } from "@/lib/validation";

const kindSchema = z.enum(MEDIA_KINDS as [MediaKind, ...MediaKind[]]);
const measure = z.number().int().min(0).max(1_000_000).nullable().optional();

export const uploadRequestSchema = z.object({
  kind: kindSchema,
  fileName: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(120),
  sizeBytes: z.number().int().positive(),
});

const title = z.string().trim().min(1, "Escribe un título.").max(120, "Usa un título más corto.");
const description = z
  .string()
  .trim()
  .max(500, "Usa una descripción más corta.")
  .transform((value) => value || null);

export const confirmUploadSchema = z.object({
  uploadId: idSchema,
  title,
  durationSeconds: measure,
  width: measure,
  height: measure,
  isBackground: z.boolean().optional(),
});

export const MEDIA_FIELDS = ["title", "description"] as const;
export type MediaField = (typeof MEDIA_FIELDS)[number];

export const mediaDetailsSchema = z.object({ title, description });

export const mediaIdSchema = idSchema;
