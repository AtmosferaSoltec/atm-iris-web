"use client";

import { LogOut, Settings2, Timer } from "lucide-react";
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
import { accountInitials } from "@/lib/text";

/** The avatar at the right of the console's top bar: Tiempos, Ajustes and Cerrar sesión. */
export function AccountMenu({ session }: { session: UserSession }) {
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Cuenta: ${session.church.name}`}
        disabled={isPending}
        className="cursor-pointer rounded-full p-0.5 transition outline-none hover:bg-surface focus-visible:bg-surface disabled:opacity-60"
      >
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-ink-inverse"
        >
          {accountInitials(session.church.name)}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="w-64">
        <div className="px-2.5 pt-1.5 pb-2">
          <p className="truncate text-sm font-semibold">{session.fullName}</p>
          <p className="truncate text-xs text-ink-2">{session.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/times">
            <Timer aria-hidden />
            Tiempos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings2 aria-hidden />
            Ajustes
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
