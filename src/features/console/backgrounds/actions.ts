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

/** A song's own background, or none (null). Only this changes: the rest of the song stays. */
export async function setSongBackground(
  songId: string,
  backgroundId: string | null,
): Promise<{ error?: string }> {
  const song = idSchema.safeParse(songId);
  const background =
    backgroundId === null
      ? { success: true as const, data: null }
      : idSchema.safeParse(backgroundId);
  if (!song.success || !background.success) return { error: "Revisa los datos enviados." };
  try {
    const { repos } = await authorize();
    const current = await repos.songs.get(song.data);
    if (!current) return { error: "Esa canción ya no existe." };
    await repos.songs.update(current.id, {
      title: current.title,
      author: current.author,
      sections: current.sections.map(({ label, text }) => ({ label, text })),
      audioId: current.audio?.id ?? null,
      youtubeId: current.youtubeId,
      backgroundId: background.data,
    });
    return {};
  } catch (error) {
    return { error: errorMessage(error) };
  }
}
