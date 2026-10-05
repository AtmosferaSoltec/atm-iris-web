import { z } from "zod";
import { idSchema, newPasswordSchema } from "@/lib/validation";

export const PROFILE_FIELDS = ["fullName"] as const;
export type ProfileField = (typeof PROFILE_FIELDS)[number];

export const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Escribe tu nombre.").max(120, "Usa un nombre más corto."),
});

export const PASSWORD_FIELDS = ["currentPassword", "password", "passwordConfirmation"] as const;
export type PasswordField = (typeof PASSWORD_FIELDS)[number];

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Escribe tu contraseña actual."),
    password: newPasswordSchema,
    passwordConfirmation: z.string().min(1, "Repite la contraseña."),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "Las contraseñas no coinciden.",
  });

export const churchIdSchema = idSchema;
export const sessionIdSchema = idSchema;
