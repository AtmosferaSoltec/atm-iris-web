"use client";

import { ChevronsUpDown, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toaster";
import type { UserSession } from "@/domain/models";
import { switchChurch } from "@/features/account/actions";
import { signOut } from "@/features/auth/actions";
import { cn } from "@/lib/cn";
import { ROLE_LABELS } from "@/lib/permissions";
import { accountInitials } from "@/lib/text";

/** Sidebar account block: church switcher (when there's more than one), Mi cuenta, Cerrar sesión. */
export function AccountMenu({ session, compact }: { session: UserSession; compact?: boolean }) {
  const [isPending, startTransition] = useTransition();

  function chooseChurch(churchId: string) {
    if (churchId === session.church.id) return;
    startTransition(async () => {
      const result = await switchChurch(churchId);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Cuenta: ${session.church.name}`}
        disabled={isPending}
        className={cn(
          "group flex w-full cursor-pointer items-center gap-3 rounded-md text-left transition outline-none hover:bg-surface focus-visible:bg-surface disabled:opacity-60",
          compact ? "w-auto p-0.5" : "p-2",
        )}
      >
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-ink-inverse"
        >
          {accountInitials(session.church.name)}
        </span>
        {!compact && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{session.church.name}</span>
              <span className="block truncate text-xs text-ink-2">{session.fullName}</span>
            </span>
            <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-ink-3" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={compact ? "end" : "start"}
        side={compact ? "bottom" : "top"}
        className="w-64"
      >
        <div className="px-2.5 pt-1.5 pb-2">
          <p className="truncate text-sm font-semibold">{session.fullName}</p>
          <p className="truncate text-xs text-ink-2">{session.email}</p>
        </div>
        {session.churches.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Iglesias</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={session.church.id} onValueChange={chooseChurch}>
              {session.churches.map((church) => (
                <DropdownMenuRadioItem key={church.id} value={church.id}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{church.name}</span>
                    <span className="block text-xs text-ink-2">{ROLE_LABELS[church.role]}</span>
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/cuenta">
            <UserRound aria-hidden />
            Mi cuenta
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem tone="danger" onSelect={() => startTransition(() => signOut())}>
          <LogOut aria-hidden />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
