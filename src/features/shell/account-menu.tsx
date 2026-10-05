import { LogOut } from "lucide-react";
import type { UserSession } from "@/domain/models";
import { accountInitials } from "@/lib/text";
import { signOut } from "@/features/auth/actions";

export function AccountMenu({ session }: { session: UserSession }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-ink-inverse"
      >
        {accountInitials(session.churchName)}
      </span>
      <div className="hidden min-w-0 flex-1 lg:block">
        <p className="truncate text-sm font-semibold">{session.churchName}</p>
        <p className="truncate text-xs text-ink-3">{session.email}</p>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="grid size-9 cursor-pointer place-items-center rounded-full text-ink-3 transition hover:bg-danger/12 hover:text-danger"
        >
          <LogOut className="size-4" />
        </button>
      </form>
    </div>
  );
}
