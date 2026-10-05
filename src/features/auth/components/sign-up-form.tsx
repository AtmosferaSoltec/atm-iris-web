"use client";

import { Building2, Lock, Mail, User } from "lucide-react";
import { useActionState } from "react";
import { Banner } from "@/components/ui/banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { idleState } from "@/lib/form-state";
import { signUp } from "../actions";

export function SignUpForm() {
  const [state, action] = useActionState(signUp, idleState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.message && <Banner tone="error">{state.message}</Banner>}
      <TextField
        id="churchName"
        label="Nombre de la iglesia"
        placeholder="Iglesia Vida Nueva"
        autoComplete="organization"
        icon={<Building2 />}
        defaultValue={state.values?.churchName}
        error={errors.churchName}
      />
      <TextField
        id="fullName"
        label="Responsable"
        placeholder="Nombre y apellido"
        autoComplete="name"
        icon={<User />}
        defaultValue={state.values?.fullName}
        error={errors.fullName}
      />
      <TextField
        id="email"
        type="email"
        label="Correo de la iglesia"
        placeholder="nombre@tuiglesia.org"
        autoComplete="email"
        icon={<Mail />}
        defaultValue={state.values?.email}
        error={errors.email}
      />
      <TextField
        id="password"
        type="password"
        label="Contraseña"
        placeholder="Crea una contraseña"
        autoComplete="new-password"
        icon={<Lock />}
        hint="Mínimo 8 caracteres."
        error={errors.password}
      />
      <SubmitButton size="lg" className="mt-1 w-full">
        Crear cuenta
      </SubmitButton>
      <p className="text-center text-xs text-ink-2">
        Al crear tu cuenta aceptas los <span className="font-semibold text-ink-2">Términos</span> y
        la <span className="font-semibold text-ink-2">Política de privacidad</span>.
      </p>
    </form>
  );
}
