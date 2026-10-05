import { KeyRound } from "lucide-react";
import type { Metadata } from "next";
import { EmailStepForm } from "@/features/auth/components/recovery/email-step-form";
import { RecoveryStep } from "@/features/auth/components/recovery/recovery-step";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default async function RecoverEmailPage({ searchParams }: PageProps<"/recuperar">) {
  const { email, vencido } = await searchParams;

  return (
    <>
      <RecoveryStep
        step={1}
        icon={<KeyRound />}
        title="Recupera tu acceso"
        description="Escribe el correo de tu iglesia y te enviaremos un código de 6 dígitos."
      />
      <EmailStepForm
        initialEmail={typeof email === "string" ? email : undefined}
        notice={
          vencido ? "El código venció mientras creabas la contraseña. Pide uno nuevo." : undefined
        }
      />
    </>
  );
}
