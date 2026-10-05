"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Repositories } from "@/server/repositories";
import { GENERIC_ERROR, type FormState } from "@/lib/form-state";
import { nameKey } from "@/lib/text";
import { authorize } from "@/server/dal";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Escribe un nombre.")
  .max(80, "Usa un nombre más corto.");
const DUPLICATE = "Ya existe una persona con ese nombre.";

async function validateName(
  repos: Repositories,
  raw: unknown,
  exceptId?: string,
): Promise<{ name: string } | { error: string }> {
  const parsed = nameSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const people = await repos.people.list();
  const key = nameKey(parsed.data);
  if (people.some((person) => person.id !== exceptId && nameKey(person.name) === key))
    return { error: DUPLICATE };
  return { name: parsed.data };
}

export async function addPerson(
  _prev: FormState<"name">,
  formData: FormData,
): Promise<FormState<"name">> {
  const { repos } = await authorize();
  const raw = String(formData.get("name") ?? "");
  try {
    const result = await validateName(repos, raw);
    if ("error" in result)
      return { status: "error", fieldErrors: { name: result.error }, values: { name: raw } };
    await repos.people.add(result.name);
  } catch (error) {
    console.error(error);
    return { status: "error", message: GENERIC_ERROR, values: { name: raw } };
  }
  revalidatePath("/personas");
  return { status: "success" };
}

export async function renamePerson(id: string, name: string): Promise<{ error?: string }> {
  const { repos } = await authorize();
  try {
    const result = await validateName(repos, name, id);
    if ("error" in result) return result;
    await repos.people.rename(id, result.name);
  } catch (error) {
    console.error(error);
    return { error: GENERIC_ERROR };
  }
  revalidatePath("/personas");
  return {};
}

export async function deletePerson(id: string): Promise<{ error?: string }> {
  const { repos } = await authorize();
  try {
    await repos.people.delete(id);
  } catch (error) {
    console.error(error);
    return { error: GENERIC_ERROR };
  }
  revalidatePath("/personas");
  return {};
}
