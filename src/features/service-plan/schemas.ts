import { z } from "zod";
import { idSchema } from "@/lib/validation";

export const addPlanItemSchema = z.object({
  kind: z.enum(["song", "media"]),
  refId: idSchema,
});

export const movePlanItemSchema = z.object({
  id: idSchema,
  position: z.number().int().min(0),
});
