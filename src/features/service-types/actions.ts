"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Person, ServiceType } from "@/domain/models";
import { GENERIC_ERROR } from "@/lib/form-state";
import { nameKey } from "@/lib/text";
import { authorize } from "@/server/dal";
import {
  serviceTypeDraftSchema,
  type SaveServiceTypeResult,
  type ServiceTypeDraft,
} from "./schemas";

export async function saveServiceType(draft: ServiceTypeDraft): Promise<SaveServiceTypeResult> {
  const { repos } = await authorize();
  const parsed = serviceTypeDraftSchema.safeParse(draft);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0];
    if (field === "name" || (field === "blocks" && issue.path.length === 1)) {
      return { fieldErrors: { [field]: issue.message } };
    }
    return { error: issue?.message ?? GENERIC_ERROR };
  }
  const data = parsed.data;

  try {
    const [types, modules] = await Promise.all([repos.serviceTypes.list(), repos.modules.get()]);
    const existing = types.find((type) => type.id === data.id);
    if (types.some((type) => type.id !== data.id && nameKey(type.name) === nameKey(data.name))) {
      return { fieldErrors: { name: "Ya existe un servicio con ese nombre." } };
    }

    const type: ServiceType = {
      id: existing?.id ?? crypto.randomUUID(),
      name: data.name,
      color: data.color,
      schedule: data.schedule,
      // With the time module off the editor hides blocks; existing ones stay untouched.
      blocks: modules.timeControl ? (data.tracksTime ? data.blocks : []) : (existing?.blocks ?? []),
    };
    await repos.serviceTypes.save(type);
  } catch (error) {
    console.error(error);
    return { error: GENERIC_ERROR };
  }

  revalidatePath("/servicios");
  redirect("/servicios");
}

export async function deleteServiceType(id: string): Promise<{ error?: string }> {
  const { repos } = await authorize();
  try {
    await repos.serviceTypes.delete(id);
  } catch (error) {
    console.error(error);
    return { error: GENERIC_ERROR };
  }
  revalidatePath("/servicios");
  redirect("/servicios");
}

/** "Agregar persona…" from a block: reuses someone with the same name if they exist. */
export async function findOrAddPerson(
  rawName: string,
): Promise<{ person?: Person; error?: string }> {
  const { repos } = await authorize();
  const parsed = z.string().trim().min(1, "Escribe un nombre.").max(80).safeParse(rawName);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const people = await repos.people.list();
    const match = people.find((person) => nameKey(person.name) === nameKey(parsed.data));
    const person = match ?? (await repos.people.add(parsed.data));
    revalidatePath("/personas");
    return { person };
  } catch (error) {
    console.error(error);
    return { error: GENERIC_ERROR };
  }
}
