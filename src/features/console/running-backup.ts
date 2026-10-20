"use client";

import type { ServiceRecord } from "@/domain/models";
import type { ServiceRecordInput } from "@/server/repositories/types";

/**
 * A copy of the service in progress in this browser, written before each save to the API.
 * Leaving the page right after a change, or losing the internet mid-service, never loses it:
 * the newest of this copy and the API's record wins when the console opens, and goes out again.
 */
type Backup = { recordId: string; input: ServiceRecordInput; savedAt: number };

const key = (churchId: string) => `iris.console.running.${churchId}`;

export function writeBackup(churchId: string, recordId: string, input: ServiceRecordInput): void {
  try {
    if (input.status === "finished") localStorage.removeItem(key(churchId));
    else
      localStorage.setItem(key(churchId), JSON.stringify({ recordId, input, savedAt: Date.now() }));
  } catch {
    // Private mode or storage full: the API save still goes out.
  }
}

/** How far a service has gone: blocks started, finished or skipped. Clocks are not compared. */
function progress(blocks: { status: string }[]): number {
  return blocks.reduce(
    (sum, block) => sum + (block.status === "pending" ? 0 : block.status === "running" ? 1 : 2),
    0,
  );
}

/**
 * The record to resume: this browser's copy when it is the same service and at least as far
 * along (it was written last, here), or when the API has none; otherwise the API's. Clocks are
 * never compared: the server's and this computer's may disagree.
 */
export function newestRunning(
  churchId: string,
  fromApi: ServiceRecord | null,
): ServiceRecord | null {
  let backup: Backup | null = null;
  try {
    const raw = localStorage.getItem(key(churchId));
    backup = raw ? (JSON.parse(raw) as Backup) : null;
  } catch {
    backup = null;
  }
  if (!backup || backup.input.status !== "inProgress") return fromApi;
  if (fromApi) {
    // Another console started a different service: it is the one running now.
    if (fromApi.id !== backup.recordId) return fromApi;
    // Another console moved this one further along.
    if (progress(fromApi.blocks) > progress(backup.input.blocks)) return fromApi;
  }
  const at = new Date(backup.savedAt).toISOString();
  return { id: backup.recordId, ...backup.input, createdAt: at, updatedAt: at };
}
