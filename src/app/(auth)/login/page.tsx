import type { Metadata } from "next";
import { AuthHero } from "@/features/auth/components/auth-hero";
import { AuthPanel } from "@/features/auth/components/auth-panel";

export const metadata: Metadata = { title: "Acceso" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { restablecida } = await searchParams;
  const notice = restablecida
    ? "Tu contraseña quedó actualizada. Inicia sesión con la nueva."
    : undefined;

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-[1280px] items-center gap-12 px-4 py-12 sm:px-8 lg:grid-cols-[1fr_auto] lg:gap-16 lg:px-16">
      <AuthHero />
      <div className="flex justify-center lg:justify-end">
        <AuthPanel notice={notice} />
      </div>
    </main>
  );
}
