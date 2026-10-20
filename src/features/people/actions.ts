"use server";

import { revalidatePath } from "next/cache";
import type { Person } from "@/domain/models";
import { nameKey } from "@/lib/text";
import { authorize } from "@/server/dal";
import { errorMessage } from "@/server/repositories/api/errors";
import { personNameSchema } from "./schemas";

// People are added where they are needed: "¿Quién dirige…?" in the console.

function revalidatePeople() {
  revalidatePath("/times");
  revalidatePath("/");
}

/**
 * "Agregar persona…" from a block: reuses whoever already has that name
 * (IRIS_SPEC §6.8), otherwise creates them.
 */
export async function findOrAddPerson(
  rawName: string,
): Promise<{ person?: Person; error?: string }> {
  const parsed = personNameSchema.safeParse(rawName);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const { repos } = await authorize();
    const people = await repos.people.list();
    const match = people.find((candidate) => nameKey(candidate.name) === nameKey(parsed.data));
    const person = match ?? (await repos.people.create(parsed.data));
    revalidatePeople();
    return { person };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}
