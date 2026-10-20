"use server";

import { revalidatePath } from "next/cache";
import { authorize } from "@/server/dal";
import { errorMessage } from "@/server/repositories/api/errors";
import type { BackupFile, EraseResult, ImportResult } from "@/server/repositories/types";
import { backupFileSchema, eraseSchema } from "./schemas";

const GENERIC_ERROR = "Revisa los datos enviados.";

/** The backup as text, to save as a file. */
export async function exportBackup(): Promise<{ json?: string; error?: string }> {
  try {
    const { repos } = await authorize();
    return { json: JSON.stringify(await repos.backup.export(), null, 2) };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

/** Brings in a backup file's songs and YouTube videos; what is already there is skipped. */
export async function importBackup(
  text: string,
): Promise<{ result?: ImportResult; error?: string }> {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(text);
  } catch {
    return { error: "Ese archivo no es un respaldo de Iris." };
  }
  const parsed = backupFileSchema.safeParse(parsedJson);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  try {
    const { repos } = await authorize();
    const result = await repos.backup.import(parsed.data as unknown as BackupFile);
    revalidatePath("/");
    return { result };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

/** Deletes everything chosen, all at once. */
export async function eraseContent(
  input: unknown,
): Promise<{ result?: EraseResult; error?: string }> {
  const parsed = eraseSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  try {
    const { repos } = await authorize();
    const { songs, media, youtube } = parsed.data;
    const result = await repos.backup.erase({ songs, media, youtube });
    revalidatePath("/");
    return { result };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}
