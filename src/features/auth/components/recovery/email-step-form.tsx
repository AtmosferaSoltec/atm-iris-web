"use client";

import { Mail } from "lucide-react";
import { useActionState } from "react";
import { Banner } from "@/components/ui/banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { idleState } from "@/lib/form-state";
import { requestResetCode } from "../../actions";

export function EmailStepForm({
  initialEmail,
  notice,
}: {
  initialEmail?: string;
  notice?: string;
}) {
  const [state, action] = useActionState(requestResetCode, idleState);

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.message ? (
        <Banner tone="error">{state.message}</Banner>
      ) : (
        notice && <Banner tone="info">{notice}</Banner>
      )}
      <TextField
        id="email"
        type="email"
        label="Correo de la iglesia"
        placeholder="nombre@tuiglesia.org"
        autoComplete="email"
        icon={<Mail />}
        defaultValue={state.values?.email ?? initialEmail}
        error={state.fieldErrors?.email}
        autoFocus
      />
      <SubmitButton size="lg" className="w-full">
        Enviar código
      </SubmitButton>
    </form>
  );
}
