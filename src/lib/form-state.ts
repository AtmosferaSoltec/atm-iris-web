import type { z } from "zod";

/** What a Server Action used with `useActionState` returns to its form. */
export type FormState<Field extends string = string> = {
  status: "idle" | "error" | "success";
  /** Banner message (service errors). */
  message?: string;
  fieldErrors?: Partial<Record<Field, string>>;
  /** Submitted values, so fields keep their content after an error (React resets forms). */
  values?: Partial<Record<Field, string>>;
};

export const idleState: FormState = { status: "idle" };

/** First message per field, in the shape `FormState.fieldErrors` expects. */
export function fieldErrorsFrom<Field extends string>(
  error: z.ZodError,
): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") as Field;
    errors[key] ??= issue.message;
  }
  return errors;
}

export function formValues<Field extends string>(
  formData: FormData,
  fields: readonly Field[],
): Record<Field, string> {
  return Object.fromEntries(
    fields.map((field) => [field, String(formData.get(field) ?? "")]),
  ) as Record<Field, string>;
}

export const GENERIC_ERROR = "Algo salió mal. Inténtalo de nuevo.";
