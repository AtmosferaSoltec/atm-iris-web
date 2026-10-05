"use server";

import { revalidatePath } from "next/cache";
import type { Person } from "@/domain/models";
import { GENERIC_ERROR, type FormState } from "@/lib/form-state";
import { nameKey } from "@/lib/text";
import { authorize } from "@/server/dal";
import { errorMessage, toFormState } from "@/server/repositories/api/errors";
import { personIdSchema, personNameSchema } from "./schemas";

// Duplicates are the API's call (PERSON_NAME_TAKEN); the form checks the
// loaded list first only to answer without a round trip.

const NAME_FIELD = ["name"] as const;
const NAME_TAKEN = { PERSON_NAME_TAKEN: "name" } as const;

function revalidatePeople() {
  revalidatePath("/personas");
  // Leaders show in the service editor and the home tiles too.
  revalidatePath("/servicios", "layout");
  revalidatePath("/");
}

export async function addPerson(
  _prev: FormState<"name">,
  formData: FormData,
): Promise<FormState<"name">> {
  const raw = String(formData.get("name") ?? "");
  const parsed = personNameSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: { name: parsed.error.issues[0].message },
      values: { name: raw },
    };
  }
  try {
    const { repos } = await authorize("people.manage");
    await repos.people.create(parsed.data);
  } catch (error) {
    return toFormState(error, NAME_FIELD, { values: { name: raw }, codes: NAME_TAKEN });
  }
  revalidatePeople();
  return { status: "success" };
}

export async function renamePerson(id: string, name: string): Promise<{ error?: string }> {
  const personId = personIdSchema.safeParse(id);
  const parsed = personNameSchema.safeParse(name);
  if (!personId.success) return { error: GENERIC_ERROR };
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const { repos } = await authorize("people.manage");
    await repos.people.rename(personId.data, parsed.data);
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePeople();
  return {};
}

export async function deletePerson(id: string): Promise<{ error?: string }> {
  const personId = personIdSchema.safeParse(id);
  if (!personId.success) return { error: GENERIC_ERROR };
  try {
    const { repos } = await authorize("people.manage");
    await repos.people.delete(personId.data);
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePeople();
  return {};
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
    const { repos } = await authorize("people.manage");
    const people = await repos.people.list();
    const match = people.find((candidate) => nameKey(candidate.name) === nameKey(parsed.data));
    const person = match ?? (await repos.people.create(parsed.data));
    revalidatePeople();
    return { person };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}
