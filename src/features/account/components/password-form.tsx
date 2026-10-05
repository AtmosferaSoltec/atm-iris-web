"use client";

import { Lock } from "lucide-react";
import { useActionState } from "react";
import { Banner } from "@/components/ui/banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { toast } from "@/components/ui/toaster";
import { idleState, type FormState } from "@/lib/form-state";
import { changePassword } from "../actions";
import type { PasswordField } from "../schemas";

export function PasswordForm() {
  const [state, action] = useActionState(
    async (previous: FormState<PasswordField>, formData: FormData) => {
      const next = await changePassword(previous, formData);
      if (next.status === "success") {
        toast.success("Contraseña actualizada. Cerramos tus otras sesiones.");
      }
      return next;
    },
    idleState,
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.message && <Banner tone="error">{state.message}</Banner>}
      <TextField
        id="currentPassword"
        type="password"
        label="Contraseña actual"
        autoComplete="current-password"
        icon={<Lock />}
        error={errors.currentPassword}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="password"
          type="password"
          label="Contraseña nueva"
          autoComplete="new-password"
          hint="Mínimo 8 caracteres."
          error={errors.password}
        />
        <TextField
          id="passwordConfirmation"
          type="password"
          label="Confirmar contraseña"
          autoComplete="new-password"
          error={errors.passwordConfirmation}
        />
      </div>
      <div>
        <SubmitButton>Cambiar contraseña</SubmitButton>
      </div>
    </form>
  );
}
