"use client";

import { Mail, User } from "lucide-react";
import { useActionState } from "react";
import { Banner } from "@/components/ui/banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { toast } from "@/components/ui/toaster";
import { idleState, type FormState } from "@/lib/form-state";
import { updateProfile } from "../actions";
import type { ProfileField } from "../schemas";

export function ProfileForm({ fullName, email }: { fullName: string; email: string }) {
  const [state, action] = useActionState(
    async (previous: FormState<ProfileField>, formData: FormData) => {
      const next = await updateProfile(previous, formData);
      if (next.status === "success") toast.success("Perfil actualizado");
      return next;
    },
    idleState,
  );

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.message && <Banner tone="error">{state.message}</Banner>}
      <TextField
        id="fullName"
        label="Nombre"
        placeholder="Nombre y apellido"
        autoComplete="name"
        icon={<User />}
        defaultValue={state.values?.fullName ?? fullName}
        error={state.fieldErrors?.fullName}
      />
      <TextField
        id="email"
        label="Correo"
        icon={<Mail />}
        value={email}
        readOnly
        hint="Es el correo con el que entras. No se puede cambiar aquí."
        className="text-ink-2"
      />
      <div>
        <SubmitButton>Guardar</SubmitButton>
      </div>
    </form>
  );
}
