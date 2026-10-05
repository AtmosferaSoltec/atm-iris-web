"use client";

import { Mail, RotateCw, X } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import type { Invitation } from "@/domain/models";
import { dayMonth } from "@/lib/format";
import { ROLE_COLORS, ROLE_LABELS } from "@/lib/permissions";
import { resendInvitation, revokeInvitation } from "../actions";

type Props = { invitations: Invitation[]; timeZone: string };

export function InvitationList({ invitations, timeZone }: Props) {
  const [revoking, setRevoking] = useState<Invitation | null>(null);
  const [revokeError, setRevokeError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  if (invitations.length === 0) {
    return <p className="text-sm text-ink-2">No hay invitaciones pendientes.</p>;
  }

  function resend(invitation: Invitation) {
    startTransition(async () => {
      const result = await resendInvitation(invitation.id);
      if (result.error) toast.error(result.error);
      else toast.success(`Invitación reenviada a ${invitation.email}`);
    });
  }

  function confirmRevoke() {
    if (!revoking) return;
    startTransition(async () => {
      const result = await revokeInvitation(revoking.id);
      if (result.error) {
        setRevokeError(result.error);
        return;
      }
      toast.success("Invitación revocada");
      setRevoking(null);
    });
  }

  return (
    <>
      <ul className="divide-y divide-line">
        {invitations.map((invitation) => (
          <li
            key={invitation.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 first:pt-0 last:pb-0"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-raised text-ink-2">
              <Mail aria-hidden className="size-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{invitation.email}</p>
              <p className="text-sm text-ink-2">
                Vence el {dayMonth(invitation.expiresAt, timeZone)} · Invitó{" "}
                {invitation.invitedBy.fullName}
              </p>
            </div>
            <Chip color={ROLE_COLORS[invitation.role]}>{ROLE_LABELS[invitation.role]}</Chip>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon={<RotateCw className="size-3.5" />}
                onClick={() => resend(invitation)}
                disabled={isPending}
              >
                Reenviar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<X className="size-3.5" />}
                className="hover:text-danger"
                onClick={() => {
                  setRevokeError(undefined);
                  setRevoking(invitation);
                }}
                disabled={isPending}
              >
                Revocar
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={revoking !== null}
        onClose={() => setRevoking(null)}
        onConfirm={confirmRevoke}
        isPending={isPending}
        error={revokeError}
        title={`¿Revocar la invitación a ${revoking?.email ?? ""}?`}
        description="El enlace que recibió dejará de funcionar."
        confirmLabel="Revocar"
      />
    </>
  );
}
