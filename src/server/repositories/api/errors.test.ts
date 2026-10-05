import { describe, expect, it, vi } from "vitest";
import { GENERIC_ERROR } from "@/lib/form-state";
import {
  ApiError,
  errorMessage,
  rethrowNavigation,
  TOO_MANY_ATTEMPTS,
  toFormState,
} from "./errors";

const FIELDS = ["name", "email"] as const;

describe("toFormState", () => {
  it("puts API field errors on the form fields", () => {
    const error = new ApiError(409, "PERSON_NAME_TAKEN", "Ya existe una persona con ese nombre.", {
      name: "Ya existe una persona con ese nombre.",
    });
    expect(toFormState(error, FIELDS, { values: { name: "Ana" } })).toEqual({
      status: "error",
      message: undefined,
      fieldErrors: { name: "Ya existe una persona con ese nombre." },
      values: { name: "Ana" },
    });
  });

  it("maps codes without `errors` to their field", () => {
    const error = new ApiError(
      400,
      "INVALID_CURRENT_PASSWORD",
      "La contraseña actual no es correcta.",
    );
    const state = toFormState(error, ["currentPassword"] as const, {
      codes: { INVALID_CURRENT_PASSWORD: "currentPassword" },
    });
    expect(state.fieldErrors).toEqual({ currentPassword: "La contraseña actual no es correcta." });
  });

  it("uses aliases and keeps the message when a field has no place in the form", () => {
    const error = new ApiError(400, "VALIDATION_FAILED", "Revisa los datos.", {
      "sections.2.text": "Muy largo",
      "client.platform": "Inválido",
    });
    const state = toFormState(error, ["lyrics"] as const, {
      aliases: { "sections.2.text": "lyrics" },
    });
    expect(state.fieldErrors).toEqual({ lyrics: "Muy largo" });
    expect(state.message).toBe("Revisa los datos.");
  });

  it("shows the API message as is, rate limits with their own text, the rest generic", () => {
    expect(toFormState(new ApiError(409, "LAST_OWNER", "Mensaje del API"), FIELDS).message).toBe(
      "Mensaje del API",
    );
    expect(toFormState(new ApiError(429, "TOO_MANY_REQUESTS", "x"), FIELDS).message).toBe(
      TOO_MANY_ATTEMPTS,
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(toFormState(new Error("boom"), FIELDS).message).toBe(GENERIC_ERROR);
    expect(errorMessage(new TypeError("x"))).toBe(GENERIC_ERROR);
  });

  it("lets Next's redirect and notFound through", () => {
    const redirect = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/login;307;",
    });
    expect(() => toFormState(redirect, FIELDS)).toThrow(redirect);
    expect(() => rethrowNavigation(new Error("other"))).not.toThrow();
  });
});
