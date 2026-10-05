"use server";

import { redirect } from "next/navigation";
import { fieldErrorsFrom, formValues, type FormState } from "@/lib/form-state";
import { clearRecovery, readRecovery, saveRecovery } from "@/server/recovery";
import { getRepositories } from "@/server/repositories";
import { errorMessage, isApiError, toFormState } from "@/server/repositories/api/errors";
import { deleteSession, getSession, startSession } from "@/server/session";
import {
  NEW_PASSWORD_FIELDS,
  newPasswordSchema,
  recoveryCodeSchema,
  recoveryEmailSchema,
  SIGN_IN_FIELDS,
  SIGN_UP_FIELDS,
  signInSchema,
  signUpSchema,
} from "./schemas";

type SignInField = (typeof SIGN_IN_FIELDS)[number];
type SignUpField = (typeof SIGN_UP_FIELDS)[number];
type NewPasswordField = (typeof NEW_PASSWORD_FIELDS)[number];

/** The session in the cookie, with the API's tokens, for actions that need the current device. */
async function currentRepositories() {
  const session = await getSession();
  return getRepositories({
    session: session ?? undefined,
    accessToken: session?.tokens?.accessToken,
  });
}

/* ------------------------------------------------------------------ Access */

export async function signIn(
  _prev: FormState<SignInField>,
  formData: FormData,
): Promise<FormState<SignInField>> {
  const values = formValues(formData, SIGN_IN_FIELDS);
  // `values` travel back to the browser: never the password.
  const kept = { email: values.email };
  const parsed = signInSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values: kept };
  }

  try {
    await startSession(await getRepositories().auth.signIn(parsed.data));
  } catch (error) {
    return toFormState(error, SIGN_IN_FIELDS, { values: kept });
  }
  redirect("/");
}

export async function signUp(
  _prev: FormState<SignUpField>,
  formData: FormData,
): Promise<FormState<SignUpField>> {
  const values = formValues(formData, SIGN_UP_FIELDS);
  const kept = { churchName: values.churchName, fullName: values.fullName, email: values.email };
  const parsed = signUpSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values: kept };
  }

  try {
    await startSession(await getRepositories().auth.signUp(parsed.data));
  } catch (error) {
    return toFormState(error, SIGN_UP_FIELDS, { values: kept });
  }
  redirect("/");
}

export async function signOut(): Promise<void> {
  // Close the session on the API too, so its tokens stop working right away.
  // If the API is unreachable the cookie still goes: the user asked to leave.
  await (
    await currentRepositories()
  ).auth
    .signOut()
    .catch((error: unknown) => console.error(error));
  await deleteSession();
  redirect("/login");
}

/* --------------------------------------------- Password recovery (3 steps) */

/** Step 1: email → a 6-digit code by email. Always moves on, account or not. */
export async function requestResetCode(
  _prev: FormState<"email">,
  formData: FormData,
): Promise<FormState<"email">> {
  const values = formValues(formData, ["email"] as const);
  const parsed = recoveryEmailSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  try {
    await getRepositories().auth.requestPasswordReset(parsed.data.email);
  } catch (error) {
    return toFormState(error, ["email"] as const, { values });
  }
  await saveRecovery({ email: parsed.data.email });
  redirect("/recuperar/codigo");
}

/** "Reenviar código" on step 2. */
export async function resendResetCode(): Promise<{ error?: string }> {
  const recovery = await readRecovery();
  if (!recovery) redirect("/recuperar");
  try {
    await getRepositories().auth.requestPasswordReset(recovery.email);
    return {};
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

/** Step 2: the code is checked (not spent) before asking for the new password. */
export async function verifyResetCode(
  _prev: FormState<"code">,
  formData: FormData,
): Promise<FormState<"code">> {
  const recovery = await readRecovery();
  if (!recovery) redirect("/recuperar");

  const values = formValues(formData, ["code"] as const);
  const parsed = recoveryCodeSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  try {
    await getRepositories().auth.verifyResetCode(recovery.email, parsed.data.code);
  } catch (error) {
    if (isApiError(error) && error.code.startsWith("RESET_")) {
      return { status: "error", fieldErrors: { code: error.message }, values };
    }
    return toFormState(error, ["code"] as const, { values });
  }
  await saveRecovery({ email: recovery.email, code: parsed.data.code });
  redirect("/recuperar/nueva");
}

/** Step 3: new password. Every session closes; back to login to sign in with it. */
export async function resetPassword(
  _prev: FormState<NewPasswordField>,
  formData: FormData,
): Promise<FormState<NewPasswordField>> {
  const recovery = await readRecovery();
  if (!recovery?.code) redirect("/recuperar");

  const parsed = newPasswordSchema.safeParse(formValues(formData, NEW_PASSWORD_FIELDS));
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    await getRepositories().auth.resetPassword({
      email: recovery.email,
      code: recovery.code,
      ...parsed.data,
    });
  } catch (error) {
    // The code expired between steps 2 and 3: start over from step 1.
    if (isApiError(error) && error.code.startsWith("RESET_")) {
      await clearRecovery();
      redirect("/recuperar?vencido=1");
    }
    return toFormState(error, NEW_PASSWORD_FIELDS);
  }

  await clearRecovery();
  // This browser's own session (if any) was closed by the API as well.
  await deleteSession();
  redirect("/login?restablecida=1");
}
