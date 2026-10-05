"use client";

import { Mail, UserPlus } from "lucide-react";
import { useActionState, useState } from "react";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { toast } from "@/components/ui/toaster";
import type { Role } from "@/domain/models";
import { idleState, type FormState } from "@/lib/form-state";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/permissions";
import { inviteMember } from "../actions";
import type { InviteField } from "../schemas";

const INVITABLE_ROLES: Role[] = ["admin", "operator"];

export function InviteButton() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button icon={<UserPlus className="size-4" />} onClick={() => setIsOpen(true)}>
        Invitar
      </Button>
      {/* Remounted on every open, so the form starts empty. */}
      {isOpen && <InviteDialog onClose={() => setIsOpen(false)} />}
    </>
  );
}

function InviteDialog({ onClose }: { onClose: () => void }) {
  const [state, action] = useActionState(
    async (previous: FormState<InviteField>, formData: FormData) => {
      const next = await inviteMember(previous, formData);
      if (next.status === "success") {
        toast.success(`Invitación enviada a ${next.values?.email}`);
        onClose();
      }
      return next;
    },
    idleState,
  );

  return (
    <Dialog
      open
      onClose={onClose}
      title="Invitar al equipo"
      description="Le enviaremos un enlace por correo. Vence en 7 días."
    >
      <form id="invite-form" action={action} className="flex flex-col gap-5 pb-4" noValidate>
        {state.message && <Banner tone="error">{state.message}</Banner>}
        <TextField
          id="email"
          type="email"
          label="Correo"
          placeholder="nombre@correo.com"
          autoComplete="off"
          icon={<Mail />}
          defaultValue={state.values?.email}
          error={state.fieldErrors?.email}
          autoFocus
        />
        <Select
          id="role"
          name="role"
          label="Rol"
          defaultValue={state.values?.role || "operator"}
          error={state.fieldErrors?.role}
          options={INVITABLE_ROLES.map((role) => ({
            value: role,
            label: ROLE_LABELS[role],
            description: ROLE_DESCRIPTIONS[role],
          }))}
        />
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <SubmitButton>Enviar invitación</SubmitButton>
        </div>
      </form>
    </Dialog>
  );
}
