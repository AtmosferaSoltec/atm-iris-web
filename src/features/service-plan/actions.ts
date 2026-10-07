"use server";

import { revalidatePath } from "next/cache";
import type { MediaAsset, SongSummary } from "@/domain/models";
import { authorize } from "@/server/dal";
import { errorMessage, isApiError } from "@/server/repositories/api/errors";
import { addPlanItemSchema, movePlanItemSchema } from "./schemas";

function revalidatePlan() {
  revalidatePath("/plan");
  revalidatePath("/");
}

export async function addPlanItem(
  kind: "song" | "media",
  refId: string,
): Promise<{ error?: string }> {
  const parsed = addPlanItemSchema.safeParse({ kind, refId });
  if (!parsed.success) return { error: "Revisa los datos enviados." };

  try {
    const { repos } = await authorize();
    await repos.servicePlan.add(parsed.data);
  } catch (error) {
    if (isApiError(error, "VALIDATION_FAILED") && error.errors?.refId) {
      return { error: error.errors.refId };
    }
    return { error: errorMessage(error) };
  }
  revalidatePlan();
  return {};
}

export async function movePlanItem(id: string, position: number): Promise<{ error?: string }> {
  const parsed = movePlanItemSchema.safeParse({ id, position });
  if (!parsed.success) return { error: "Revisa los datos enviados." };

  try {
    const { repos } = await authorize();
    await repos.servicePlan.move(parsed.data.id, parsed.data.position);
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePlan();
  return {};
}

export async function removePlanItem(id: string): Promise<{ error?: string }> {
  try {
    const { repos } = await authorize();
    await repos.servicePlan.remove(id);
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePlan();
  return {};
}

export async function clearPlan(): Promise<{ error?: string }> {
  try {
    const { repos } = await authorize();
    await repos.servicePlan.clear();
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePlan();
  return {};
}

/** For the "add" dialog's search box. Up to 20 of each, most relevant/recent first. */
export async function searchSongsForPlan(query: string): Promise<SongSummary[]> {
  const { repos } = await authorize();
  const page = await repos.songs.list({ search: query, limit: 20 });
  return page.data;
}

/** Música: audio tracks only. */
export async function searchMusicForPlan(query: string): Promise<MediaAsset[]> {
  const { repos } = await authorize();
  const page = await repos.media.list({ kind: "audio", search: query, limit: 20 });
  return page.data;
}

/** Multimedia: images and videos, never the ones that are only a lyrics background (those stay in Fondos). */
export async function searchMediaForPlan(query: string): Promise<MediaAsset[]> {
  const { repos } = await authorize();
  const page = await repos.media.list({
    kind: ["image", "video"],
    isBackground: false,
    search: query,
    limit: 20,
  });
  return page.data;
}
