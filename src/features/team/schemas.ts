import { z } from "zod";
import { ROLES } from "@/lib/permissions";
import { emailSchema, idSchema, newPasswordSchema } from "@/lib/validation";

export const roleSchema = z.enum(ROLES as ["owner", "admin", "operator"]);

export const INVITE_FIELDS = ["email", "role"] as const;
export type InviteField = (typeof INVITE_FIELDS)[number];

export const inviteSchema = z.object({ email: emailSchema, role: roleSchema });

export const memberIdSchema = idSchema;

export const ACCEPT_FIELDS = ["fullName", "password"] as const;
export type AcceptField = (typeof ACCEPT_FIELDS)[number];

/** A new account sets its name and password; an existing one proves it's theirs. */
export function acceptInvitationSchema(hasAccount: boolean) {
  return hasAccount
    ? z.object({ password: z.string().min(1, "Escribe tu contraseña.") })
    : z.object({
        fullName: z
          .string()
          .trim()
          .min(1, "Escribe tu nombre.")
          .max(120, "Usa un nombre más corto."),
        password: newPasswordSchema,
      });
}

export const invitationTokenSchema = z.string().trim().min(1).max(200);
