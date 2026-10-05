"use client";

import { Lock, Mail, User, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Banner } from "@/components/ui/banner";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { toast } from "@/components/ui/toaster";
import type { InvitationPreview } from "@/domain/models";
import { idleState, type FormState } from "@/lib/form-state";
import { ROLE_LABELS } from "@/lib/permissions";
import { acceptInvitation } from "../actions";
import type { AcceptField } from "../schemas";

export function AcceptInvitationForm({
  token,
  preview,
}: {
  token: string;
  preview: InvitationPreview;
}) {
  const router = useRouter();
  const [state, action] = useActionState(
    async (previous: FormState<AcceptField>, formData: FormData) => {
      const next = await acceptInvitation(token, preview.hasAccount, previous, formData);
      if (next.status === "success") {
        toast.success(`Te uniste a ${preview.churchName}`);
        router.replace("/");
      }
      return next;
    },
    idleState,
  );
  const errors = state.fieldErrors ?? {};

  return (
    <>
      <header className="flex flex-col gap-4">
        <span className="grid size-12 place-items-center rounded-full bg-violet/14 text-violet">
          <Users aria-hidden className="size-6" />
        </span>
        <h1 className="font-serif text-[28px] leading-tight font-medium tracking-tight">
          {preview.invitedByName} te invitó a{" "}
          <span className="text-accent">{preview.churchName}</span> como{" "}
          {ROLE_LABELS[preview.role].toLowerCase()}
        </h1>
        {preview.hasAccount && (
          <p className="text-[15px] text-ink-2">Ya tienes una cuenta de Iris con este correo.</p>
        )}
      </header>

      <form action={action} className="flex flex-col gap-5" noValidate>
        {state.message && <Banner tone="error">{state.message}</Banner>}
        <TextField id="email" label="Correo" icon={<Mail />} value={preview.email} readOnly />
        {!preview.hasAccount && (
          <TextField
            id="fullName"
            label="Tu nombre"
            placeholder="Nombre y apellido"
            autoComplete="name"
            icon={<User />}
            defaultValue={state.values?.fullName}
            error={errors.fullName}
            autoFocus
          />
        )}
        <TextField
          id="password"
          type="password"
          label="Contraseña"
          placeholder={preview.hasAccount ? "Tu contraseña" : "Crea una contraseña"}
          autoComplete={preview.hasAccount ? "current-password" : "new-password"}
          icon={<Lock />}
          hint={preview.hasAccount ? undefined : "Mínimo 8 caracteres."}
          error={errors.password}
          autoFocus={preview.hasAccount}
        />
        <SubmitButton size="lg" className="mt-1 w-full">
          Unirme
        </SubmitButton>
      </form>
    </>
  );
}
