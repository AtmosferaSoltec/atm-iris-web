import Link from "next/link";
import type { ReactNode } from "react";
import { IrisWordmark } from "@/components/brand/iris-mark";
import { BackLink } from "@/components/ui/back-link";
import { Surface } from "@/components/ui/surface";

/** Narrow centered card with the wordmark and a way back to the login (recovery, invitations). */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center gap-8 px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/login" aria-label="Iris">
          <IrisWordmark height={26} />
        </Link>
        <BackLink href="/login">Volver al inicio de sesión</BackLink>
      </div>
      <Surface className="flex flex-col gap-8 rounded-2xl p-6 sm:p-10">{children}</Surface>
    </main>
  );
}
