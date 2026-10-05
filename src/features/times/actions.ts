"use server";

import { revalidatePath } from "next/cache";
import { GENERIC_ERROR } from "@/lib/form-state";
import { authorize } from "@/server/dal";
import { errorMessage } from "@/server/repositories/api/errors";
import { actualSecondsSchema, blockRefSchema, leaderSchema, recordIdSchema } from "./schemas";

type Result = { error?: string };

function revalidateTimes() {
  revalidatePath("/tiempos");
  // Block counts per person and the home tile read records too.
  revalidatePath("/personas");
  revalidatePath("/");
}

/** "Ajustar duración…": the block becomes `adjusted`. */
export async function adjustBlockDuration(
  recordId: string,
  blockId: string,
  seconds: number,
): Promise<Result> {
  const ref = blockRefSchema.safeParse({ recordId, blockId });
  const actual = actualSecondsSchema.safeParse(seconds);
  if (!ref.success) return { error: GENERIC_ERROR };
  if (!actual.success) return { error: actual.error.issues[0].message };
  try {
    const { repos } = await authorize("records.manage");
    await repos.records.adjustBlock(ref.data.recordId, ref.data.blockId, {
      actualSeconds: actual.data,
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidateTimes();
  return {};
}

/** "Cambiar responsable": the API also refreshes the saved name. */
export async function changeBlockLeader(
  recordId: string,
  blockId: string,
  personId: string | null,
): Promise<Result> {
  const ref = blockRefSchema.safeParse({ recordId, blockId });
  const leader = leaderSchema.safeParse(personId);
  if (!ref.success || !leader.success) return { error: GENERIC_ERROR };
  try {
    const { repos } = await authorize("records.manage");
    await repos.records.adjustBlock(ref.data.recordId, ref.data.blockId, { personId: leader.data });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidateTimes();
  return {};
}

export async function deleteRecord(id: string): Promise<Result> {
  const recordId = recordIdSchema.safeParse(id);
  if (!recordId.success) return { error: GENERIC_ERROR };
  try {
    const { repos } = await authorize("records.manage");
    await repos.records.delete(recordId.data);
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidateTimes();
  return {};
}
