import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NewPasswordStepForm } from "@/features/auth/components/recovery/new-password-step-form";
import { RecoveryStep } from "@/features/auth/components/recovery/recovery-step";
import { readRecovery } from "@/server/recovery";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default async function RecoverPasswordPage() {
  const recovery = await readRecovery();
  if (!recovery?.code) redirect("/recuperar");

  return (
    <>
      <RecoveryStep
        step={3}
        icon={<ShieldCheck />}
        title="Crea tu nueva contraseña"
        description="Al guardarla cerramos la sesión en todos tus dispositivos y vuelves a iniciar sesión."
      />
      <NewPasswordStepForm />
    </>
  );
}
