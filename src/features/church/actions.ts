"use server";

import { revalidatePath } from "next/cache";
import { fieldErrorsFrom, formValues, type FormState } from "@/lib/form-state";
import { authorize } from "@/server/dal";
import { toFormState } from "@/server/repositories/api/errors";
import { createSession } from "@/server/session";
import { CHURCH_FIELDS, churchSchema, type ChurchField } from "./schemas";

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
    const { repos, session, tokens } = await authorize();
    const church = await repos.church.update(parsed.data);
    // Name and zone travel in the session (sidebar, dates): keep the cookie in step.
    await createSession({
      ...session,
      church: { id: church.id, name: church.name, timezone: church.timezone },
      tokens,
    });
  } catch (error) {
    return toFormState(error, CHURCH_FIELDS, { values });
  }
  revalidatePath("/", "layout");
  return { status: "success", values: parsed.data };
}
