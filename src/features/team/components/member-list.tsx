"use client";

import { Ellipsis, ShieldCheck, UserMinus } from "lucide-react";
import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toaster";
import type { Member, Role } from "@/domain/models";
import { assignableRoles, canManageMember, ROLE_COLORS, ROLE_LABELS } from "@/lib/permissions";
import { changeMemberRole, removeMember } from "../actions";

type Props = { members: Member[]; actorRole: Role; canManage: boolean };

export function MemberList({ members, actorRole, canManage }: Props) {
  const [removing, setRemoving] = useState<Member | null>(null);
  const [removeError, setRemoveError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function setRole(member: Member, role: string) {
    if (role === member.role) return;
    startTransition(async () => {
      const result = await changeMemberRole(member.id, role as Role);
      if (result.error) toast.error(result.error);
      else
        toast.success(
          `${member.user.fullName} ahora es ${ROLE_LABELS[role as Role].toLowerCase()}`,
        );
    });
  }

  function confirmRemove() {
    if (!removing) return;
    startTransition(async () => {
      const result = await removeMember(removing.id);
      if (result.error) {
        setRemoveError(result.error);
        return;
      }
      toast.success(`${removing.user.fullName} ya no es parte del equipo`);
      setRemoving(null);
    });
  }

  return (
    <>
      <ul className="divide-y divide-line">
        {members.map((member, index) => {
          const showsMenu = canManage && canManageMember(actorRole, member.role);
          return (
            <li key={member.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              <Avatar name={member.user.fullName} index={index} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-semibold">
                  <span className="truncate">{member.user.fullName}</span>
                  {member.isCurrentUser && (
                    <span className="text-xs font-medium text-ink-2">Tú</span>
                  )}
                </p>
                <p className="truncate text-sm text-ink-2">{member.user.email}</p>
              </div>
              <Chip color={ROLE_COLORS[member.role]}>{ROLE_LABELS[member.role]}</Chip>
              {canManage && (
                <div className="w-9">
                  {showsMenu && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <IconButton
                          label={`Opciones de ${member.user.fullName}`}
                          disabled={isPending}
                        >
                          <Ellipsis />
                        </IconButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <ShieldCheck aria-hidden />
                            Cambiar rol
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup
                              value={member.role}
                              onValueChange={(role) => setRole(member, role)}
                            >
                              {assignableRoles(actorRole).map((role) => (
                                <DropdownMenuRadioItem key={role} value={role}>
                                  {ROLE_LABELS[role]}
                                </DropdownMenuRadioItem>
                              ))}
                            </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          tone="danger"
                          onSelect={() => {
                            setRemoveError(undefined);
                            setRemoving(member);
                          }}
                        >
                          <UserMinus aria-hidden />
                          Quitar del equipo
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
        isPending={isPending}
        error={removeError}
        title={`¿Quitar a ${removing?.user.fullName ?? ""}?`}
        description="Dejará de tener acceso a esta iglesia en todos sus dispositivos."
        confirmLabel="Quitar"
      />
    </>
  );
}
