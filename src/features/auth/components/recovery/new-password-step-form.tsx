"use client";

import { Lock } from "lucide-react";
import { useActionState } from "react";
import { Banner } from "@/components/ui/banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { idleState } from "@/lib/form-state";
import { resetPassword } from "../../actions";

export function NewPasswordStepForm() {
  const [state, action] = useActionState(resetPassword, idleState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.message && <Banner tone="error">{state.message}</Banner>}
      <TextField
        id="password"
        type="password"
        label="Contraseña nueva"
        placeholder="Crea una contraseña"
        autoComplete="new-password"
        icon={<Lock />}
        hint="Mínimo 8 caracteres."
        error={errors.password}
        autoFocus
      />
      <TextField
        id="passwordConfirmation"
        type="password"
        label="Confirma la contraseña"
        placeholder="Repite la contraseña"
        autoComplete="new-password"
        icon={<Lock />}
        error={errors.passwordConfirmation}
      />
      <SubmitButton size="lg" className="w-full">
        Guardar y volver a iniciar sesión
      </SubmitButton>
    </form>
  );
}
