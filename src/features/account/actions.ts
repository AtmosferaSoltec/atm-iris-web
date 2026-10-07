"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fieldErrorsFrom, formValues, GENERIC_ERROR, type FormState } from "@/lib/form-state";
import { authorize } from "@/server/dal";
import { errorMessage, toFormState } from "@/server/repositories/api/errors";
import { createSession, deleteSession } from "@/server/session";
import {
  changePasswordSchema,
  PASSWORD_FIELDS,
  PROFILE_FIELDS,
  profileSchema,
  sessionIdSchema,
  type PasswordField,
  type ProfileField,
} from "./schemas";

export async function updateProfile(
  _prev: FormState<ProfileField>,
  formData: FormData,
): Promise<FormState<ProfileField>> {
  const values = formValues(formData, PROFILE_FIELDS);
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };
  }
  try {
    const { repos, tokens } = await authorize();
    const session = await repos.auth.updateProfile(parsed.data.fullName);
    // The name shows in the sidebar: keep the cookie in step.
    await createSession({ ...session, tokens });
  } catch (error) {
    return toFormState(error, PROFILE_FIELDS, { values });
  }
  revalidatePath("/", "layout");
  return { status: "success", values: { fullName: parsed.data.fullName } };
}

export async function changePassword(
  _prev: FormState<PasswordField>,
  formData: FormData,
): Promise<FormState<PasswordField>> {
  const parsed = changePasswordSchema.safeParse(formValues(formData, PASSWORD_FIELDS));
  // Passwords never travel back in `values`.
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  try {
    const { repos } = await authorize();
    await repos.auth.changePassword(parsed.data);
  } catch (error) {
    return toFormState(error, PASSWORD_FIELDS, {
      codes: { INVALID_CURRENT_PASSWORD: "currentPassword" },
    });
  }
  revalidatePath("/cuenta");
  return { status: "success" };
}

/** Closes one device. Closing this one is signing out. */
export async function revokeSession(rawId: string): Promise<{ error?: string }> {
  const id = sessionIdSchema.safeParse(rawId);
  if (!id.success) return { error: GENERIC_ERROR };
  let isCurrent = false;
  try {
    const { repos, session } = await authorize();
    isCurrent = session.sessionId === id.data;
    await repos.auth.revokeSession(id.data);
  } catch (error) {
    return { error: errorMessage(error) };
  }
  if (isCurrent) {
    await deleteSession();
    redirect("/login");
  }
  revalidatePath("/cuenta");
  return {};
}

export async function signOutEverywhere(): Promise<{ error?: string }> {
  try {
    const { repos } = await authorize();
    await repos.auth.signOutAll();
  } catch (error) {
    return { error: errorMessage(error) };
  }
  await deleteSession();
  redirect("/login");
}
