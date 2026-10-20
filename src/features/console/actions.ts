"use server";

import { revalidatePath } from "next/cache";
import { idSchema } from "@/lib/validation";
import { authorize } from "@/server/dal";
import { errorMessage, isApiError } from "@/server/repositories/api/errors";
import { consoleItemFor } from "./load";
import type { ConsoleItem, LibraryEntry } from "./model";
import { youtubeEntry } from "./library/entries";
import { z } from "zod";
import type { Display, ServiceType } from "@/domain/models";
import {
  addToServiceSchema,
  claimDisplaySchema,
  quickServiceSchema,
  refreshUrlsSchema,
  serviceRecordSchema,
  youTubeLinkSchema,
} from "./schemas";
import { youTubeVideoId } from "@/lib/youtube";
import { lookUpYouTube } from "@/server/youtube";

/**
 * Adds a library entry to the end of the service. The service is the plan (contract §15),
 * so the iPad and the Plan page see it too.
 */
export async function addToService(
  kind: "song" | "media" | "bible" | "youtube",
  refId: string,
): Promise<{ item?: ConsoleItem; error?: string }> {
  const parsed = addToServiceSchema.safeParse({ kind, refId });
  if (!parsed.success) return { error: "Revisa los datos enviados." };
  try {
    const { repos } = await authorize();
    const row = await repos.servicePlan.add(parsed.data);
    const item = await consoleItemFor(repos, row.kind, row.refId, row.id);
    revalidatePath("/");
    return item ? { item } : { error: "No pudimos abrir ese elemento." };
  } catch (error) {
    if (isApiError(error, "VALIDATION_FAILED") && error.errors?.refId) {
      return { error: error.errors.refId };
    }
    return { error: errorMessage(error) };
  }
}

/** An image, video or YouTube link as the console shows it, to put on the screens without adding it to the service. */
export async function quickItem(
  kind: "media" | "youtube",
  refId: string,
): Promise<{ item?: ConsoleItem; error?: string }> {
  const parsed = addToServiceSchema.safeParse({ kind, refId });
  if (!parsed.success) return { error: "Revisa los datos enviados." };
  try {
    const { repos } = await authorize();
    const item = await consoleItemFor(repos, kind, refId, `quick:${refId}`);
    return item ? { item } : { error: "No pudimos abrir ese elemento." };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

/** New signed URLs for files already in the console (they last an hour, contract §11). */
export async function refreshFileUrls(ids: string[]): Promise<Record<string, string>> {
  const parsed = refreshUrlsSchema.safeParse(ids);
  if (!parsed.success) return {};
  const { repos } = await authorize();
  const entries = await Promise.all(
    parsed.data.map(async (id) => {
      try {
        return [id, (await repos.media.downloadUrl(id)).url] as const;
      } catch {
        return null;
      }
    }),
  );
  return Object.fromEntries(entries.filter((entry) => entry !== null));
}

/**
 * Saves the service's times: on every change while it runs (`inProgress`) and once more
 * when it ends (`finished`). Same id every time, so a retry never duplicates (contract §14).
 */
export async function saveServiceRecord(id: string, input: unknown): Promise<{ error?: string }> {
  const recordId = idSchema.safeParse(id);
  const parsed = serviceRecordSchema.safeParse(input);
  if (!recordId.success || !parsed.success) return { error: "Revisa los datos enviados." };
  try {
    const { repos } = await authorize();
    await repos.records.save(recordId.data, parsed.data);
  } catch (error) {
    return { error: errorMessage(error) };
  }
  if (parsed.data.status === "finished") revalidatePath("/times");
  return {};
}

/** "Crear servicio" from the console, without leaving it: a name and its blocks. */
export async function createConsoleService(
  input: unknown,
): Promise<{ serviceType?: ServiceType; error?: string }> {
  const parsed = quickServiceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  try {
    const { repos } = await authorize();
    const serviceType = await repos.serviceTypes.create({
      name: parsed.data.name,
      schedule: null,
      blocks: parsed.data.blocks,
    });
    return { serviceType };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

/**
 * Saves a YouTube link in the library (Multimedia > YouTube). The title comes from YouTube's
 * oEmbed (public, no API key); the video plays in YouTube's own player, nothing is downloaded
 * (YouTube's terms forbid it).
 */
export async function saveYouTubeVideo(
  link: string,
): Promise<{ entry?: LibraryEntry; error?: string }> {
  const parsed = youTubeLinkSchema.safeParse(link);
  const videoId = parsed.success ? youTubeVideoId(parsed.data) : null;
  if (!videoId) return { error: "Ese enlace no es de un video de YouTube." };
  const { repos } = await authorize();
  const found = await lookUpYouTube(videoId);
  if (!found.video) return { error: found.error };
  try {
    const video = await repos.youtubeVideos.create({
      videoId,
      title: found.video.title,
      author: found.video.author,
    });
    return { entry: youtubeEntry(video) };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

/** Takes a YouTube video out of the library; the API also takes it out of the plan. */
export async function deleteYouTubeVideo(id: string): Promise<{ error?: string }> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { error: "Revisa los datos enviados." };
  try {
    const { repos } = await authorize();
    await repos.youtubeVideos.delete(parsed.data);
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath("/");
  return {};
}

/** The church's TVs and whether they are on (contract §18). */
export async function listDisplays(): Promise<Display[]> {
  try {
    const { repos } = await authorize();
    return await repos.displays.list();
  } catch {
    return [];
  }
}

/** "Agregar pantalla": links the screen that shows this code. */
export async function claimDisplay(
  code: string,
  name: string,
): Promise<{ display?: Display; error?: string; fieldErrors?: { code?: string; name?: string } }> {
  const parsed = claimDisplaySchema.safeParse({ code, name });
  if (!parsed.success) {
    const fields = z.flattenError(parsed.error).fieldErrors;
    return { fieldErrors: { code: fields.code?.[0], name: fields.name?.[0] } };
  }
  try {
    const { repos } = await authorize();
    return { display: await repos.displays.claim(parsed.data.code, parsed.data.name) };
  } catch (error) {
    if (isApiError(error, "VALIDATION_FAILED") && error.errors?.code) {
      return { fieldErrors: { code: error.errors.code } };
    }
    return { error: errorMessage(error) };
  }
}

/** Unlinks a TV: it goes back to showing a code. */
export async function removeDisplay(id: string): Promise<{ error?: string }> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { error: "Revisa los datos enviados." };
  try {
    const { repos } = await authorize();
    await repos.displays.remove(parsed.data);
    return {};
  } catch (error) {
    return { error: errorMessage(error) };
  }
}
