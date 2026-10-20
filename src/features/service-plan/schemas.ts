import { z } from "zod";
import { parsePassageId } from "@/lib/bible-reference";
import { idSchema } from "@/lib/validation";

/** A song, a file or a saved YouTube video by id, or a passage (`rvr1909:JHN.3.16-18`, contract §15). */
export const addPlanItemSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.enum(["song", "media", "youtube"]), refId: idSchema }),
  z.object({
    kind: z.literal("bible"),
    refId: z.string().refine((id) => parsePassageId(id) !== null, "Ese pasaje no existe."),
  }),
]);

export const movePlanItemSchema = z.object({
  id: idSchema,
  position: z.number().int().min(0),
});
