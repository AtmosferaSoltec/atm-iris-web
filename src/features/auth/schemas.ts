import { z } from "zod";

// Same rules and messages as atm-iris-api (src/modules/auth/dto/auth.schema.ts),
// checked here first so the form answers without a round trip.

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Ingresa el correo de tu iglesia.")
  .pipe(z.email("Ese correo no parece válido."));

const newPassword = z
  .string()
  .min(1, "Ingresa tu contraseña.")
  .min(8, "Usa al menos 8 caracteres.")
  .max(128, "Usa como máximo 128 caracteres.");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Ingresa tu contraseña."),
});

export const signUpSchema = z.object({
  churchName: z.string().trim().min(1, "Escribe el nombre de tu iglesia.").max(120),
  leaderName: z.string().trim().min(1, "Escribe el nombre del responsable.").max(120),
  email,
  password: newPassword,
});

export const recoveryEmailSchema = z.object({ email });

export const recoveryCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "El código tiene 6 dígitos."),
});

export const newPasswordSchema = z
  .object({
    password: newPassword,
    passwordConfirmation: z.string().min(1, "Repite la contraseña."),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "Las contraseñas no coinciden.",
  });

export const SIGN_IN_FIELDS = ["email", "password"] as const;
export const SIGN_UP_FIELDS = ["churchName", "leaderName", "email", "password"] as const;
export const NEW_PASSWORD_FIELDS = ["password", "passwordConfirmation"] as const;
