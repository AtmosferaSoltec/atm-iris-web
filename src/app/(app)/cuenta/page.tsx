import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { DeviceList } from "@/features/account/components/device-list";
import { PasswordForm } from "@/features/account/components/password-form";
import { ProfileForm } from "@/features/account/components/profile-form";
import { requireSession } from "@/server/dal";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function AccountPage() {
  const { session, repos } = await requireSession();
  const sessions = await repos.auth.listSessions();

  return (
    <div className="mx-auto flex max-w-settings flex-col gap-8">
      <PageHeader
        title="Mi cuenta"
        description="Tu nombre, tu contraseña y dónde tienes la sesión abierta."
      />
      <Panel title="Perfil">
        <ProfileForm fullName={session.fullName} email={session.email} />
      </Panel>
      <Panel
        title="Contraseña"
        description="Al cambiarla se cierran tus sesiones en los demás dispositivos."
      >
        <PasswordForm />
      </Panel>
      <Panel title="Dispositivos" description="Donde tu cuenta tiene la sesión abierta.">
        <DeviceList
          sessions={sessions}
          timeZone={session.church.timezone}
          now={new Date().toISOString()}
        />
      </Panel>
    </div>
  );
}
