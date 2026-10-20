import { z } from "zod";
import { PROJECTION_FONT_KEYS, PROJECTION_FONT_SIZE } from "@/domain/projection-fonts";

/** How the lyrics look (contract §6), from "Texto" in the console. */
export const typographySchema = z.object({
  fontFamily: z.enum(PROJECTION_FONT_KEYS, "Esa tipografía no existe."),
  fontSizePt: z
    .number()
    .int()
    .min(PROJECTION_FONT_SIZE.min, `Mínimo ${PROJECTION_FONT_SIZE.min}.`)
    .max(PROJECTION_FONT_SIZE.max, `Máximo ${PROJECTION_FONT_SIZE.max}.`),
  fontBold: z.boolean(),
  fontItalic: z.boolean(),
  uppercase: z.boolean(),
});
