"use client";

import { ChevronsUpDown, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserSession } from "@/domain/models";
import { signOut } from "@/features/auth/actions";
import { cn } from "@/lib/cn";
import { accountInitials } from "@/lib/text";

/** Sidebar account block: Mi cuenta and Cerrar sesión. */
export function AccountMenu({ session, compact }: { session: UserSession; compact?: boolean }) {
  const [isPending, startTransition] = useTransition();

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
