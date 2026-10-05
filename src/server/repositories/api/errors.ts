import { GENERIC_ERROR, type FormState } from "@/lib/form-state";

// Kept free of `server-only` and Next imports: the mocks throw the same error
// and unit tests import it directly.

/** atm-iris-api error contract (§1.2): `code` is stable English, `message` is Spanish for the screen. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    /** Per-field messages; nested keys use dots ("blocks.2.name"). */
    readonly errors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const NETWORK_MESSAGE = "No pudimos conectarnos. Verifica tu conexión a internet.";
export const TOO_MANY_ATTEMPTS =
  "Hiciste demasiados intentos. Espera un minuto y vuelve a intentarlo.";

export function isApiError(error: unknown, code?: string): error is ApiError {
  return error instanceof ApiError && (code === undefined || error.code === code);
}

/**
 * redirect() and notFound() work by throwing. An action's catch must let them
 * through (what `unstable_rethrow` does), without importing Next here.
 */
export function rethrowNavigation(error: unknown): void {
  const digest = (error as { digest?: unknown } | null)?.digest;
  if (typeof digest === "string" && digest.startsWith("NEXT_")) throw error;
}

type ToFormStateOptions<F extends string> = {
  /** Submitted values to keep in the form. Never include a password. */
  values?: Partial<Record<F, string>>;
  /** API field names that differ from the form's: `{ fullName: "name" }`. */
  aliases?: Record<string, F>;
  /** Error codes that belong to one field even when the API sends no `errors`. */
  codes?: Record<string, F>;
};

/**
 * Turns any failure of a Server Action into its form state. API field errors
 * land on the form field with the same name (or its alias); everything else
 * becomes the banner message, which the API already wrote in Spanish.
 */
export function toFormState<F extends string>(
  error: unknown,
  fields: readonly F[],
  { values, aliases = {}, codes = {} }: ToFormStateOptions<F> = {},
): FormState<F> {
  rethrowNavigation(error);
  if (!(error instanceof ApiError)) {
    console.error(error);
    return { status: "error", message: GENERIC_ERROR, values };
  }
  if (error.code === "TOO_MANY_REQUESTS") {
    return { status: "error", message: TOO_MANY_ATTEMPTS, values };
  }

  const fieldErrors: Partial<Record<F, string>> = {};
  let unmatched = false;
  const codeField = codes[error.code];
  if (codeField) fieldErrors[codeField] = error.errors?.[codeField] ?? error.message;
  for (const [key, message] of Object.entries(error.errors ?? {})) {
    const field = aliases[key] ?? fields.find((name) => name === key);
    if (field) fieldErrors[field] ??= message;
    else unmatched = true;
  }

  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  return {
    status: "error",
    // Without a field to point at, the general message still tells what happened.
    message: hasFieldErrors && !unmatched ? undefined : error.message,
    fieldErrors: hasFieldErrors ? fieldErrors : undefined,
    values,
  };
}

/** For actions that answer `{ error }` instead of a form state. */
export function errorMessage(error: unknown): string {
  rethrowNavigation(error);
  if (error instanceof ApiError) {
    return error.code === "TOO_MANY_REQUESTS" ? TOO_MANY_ATTEMPTS : error.message;
  }
  console.error(error);
  return GENERIC_ERROR;
}
