"use server";

import { revalidatePath } from "next/cache";
import type { ChurchModules } from "@/domain/models";
import { fieldErrorsFrom, formValues, GENERIC_ERROR, type FormState } from "@/lib/form-state";
import { authorize } from "@/server/dal";
import { errorMessage, toFormState } from "@/server/repositories/api/errors";
import { createSession } from "@/server/session";
import { CHURCH_FIELDS, churchSchema, modulesSchema, type ChurchField } from "./schemas";

export async function updateChurch(
  _prev: FormState<ChurchField>,
  formData: FormData,
): Promise<FormState<ChurchField>> {
  const values = formValues(formData, CHURCH_FIELDS);
  const parsed = churchSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };
  }
  try {
    const { repos, session, tokens } = await authorize("church.manage");
    const church = await repos.church.update(parsed.data);
    // Name and zone travel in the session (sidebar, dates): keep the cookie in step.
    await createSession({
      ...session,
      church: { id: church.id, name: church.name, timezone: church.timezone },
      churches: session.churches.map((item) =>
        item.id === church.id ? { ...item, name: church.name } : item,
      ),
      tokens,
    });
  } catch (error) {
    return toFormState(error, CHURCH_FIELDS, { values });
  }
  revalidatePath("/", "layout");
  return { status: "success", values: parsed.data };
}

export async function saveModules(modules: ChurchModules): Promise<{ error?: string }> {
  const parsed = modulesSchema.safeParse(modules);
  if (!parsed.success) return { error: GENERIC_ERROR };
  try {
    const { repos } = await authorize("modules.manage");
    await repos.church.setModules(parsed.data);
  } catch (error) {
    return { error: errorMessage(error) };
  }
  // Navigation and every screen depend on the modules.
  revalidatePath("/", "layout");
  return {};
}
