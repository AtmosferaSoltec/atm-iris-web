import Link from "next/link";
import { IrisWordmark } from "@/components/brand/iris-mark";
import { BackLink } from "@/components/ui/back-link";
import { Surface } from "@/components/ui/surface";

export default function RecoveryLayout({ children }: LayoutProps<"/recuperar">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center gap-8 px-4 py-12">
      <div className="flex items-center justify-between">
        <Link href="/login" aria-label="Iris">
          <IrisWordmark height={26} />
        </Link>
        <BackLink href="/login">Volver al inicio de sesión</BackLink>
      </div>
      <Surface className="flex flex-col gap-8 rounded-2xl p-8 sm:p-10">{children}</Surface>
    </main>
  );
}
