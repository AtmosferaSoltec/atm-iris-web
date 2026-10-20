"use server";

import { MEDIA_BACKGROUND_COLORS, type ProjectionBackground } from "@/features/projection/model";
import { idSchema } from "@/lib/validation";
import { authorize } from "@/server/dal";
import { errorMessage } from "@/server/repositories/api/errors";

/** A background just uploaded, as the console shows it (with its signed URL). */
export async function backgroundFor(
  id: string,
): Promise<{ background?: ProjectionBackground; error?: string }> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { error: "Revisa los datos enviados." };
  try {
    const { repos } = await authorize();
    const asset = await repos.media.get(parsed.data);
    if (!asset?.isBackground) return { error: "Ese fondo ya no existe." };
    const { url } = await repos.media.downloadUrl(asset.id);
    return {
      background: {
        id: asset.id,
        name: asset.title,
        colors: MEDIA_BACKGROUND_COLORS,
        ...(asset.kind === "video"
          ? { videoUrl: url, durationSeconds: asset.durationSeconds }
          : { imageUrl: url }),
      },
    };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}
