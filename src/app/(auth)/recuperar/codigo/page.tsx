import { MailOpen } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CodeStepForm } from "@/features/auth/components/recovery/code-step-form";
import { RecoveryStep } from "@/features/auth/components/recovery/recovery-step";
import { readRecovery } from "@/server/recovery";

export const metadata: Metadata = { title: "Escribe el código" };

export default async function RecoverCodePage() {
  const recovery = await readRecovery();
  if (!recovery) redirect("/recuperar");

  return (
    <>
      <RecoveryStep
        step={2}
        icon={<MailOpen />}
        title="Revisa tu correo"
        description={
          <>
            Si <strong className="text-ink">{recovery.email}</strong> tiene una cuenta de Iris, te
            llegó un código. Vence en 15 minutos.
          </>
        }
      />
      <CodeStepForm />
    </>
  );
}
