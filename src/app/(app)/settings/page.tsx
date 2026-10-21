import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { DeleteAccountPanel } from "@/features/account/components/delete-account-panel";
import { DeviceList } from "@/features/account/components/device-list";
import { PasswordForm } from "@/features/account/components/password-form";
import { ProfileForm } from "@/features/account/components/profile-form";
import { BackupPanel } from "@/features/backup/components/backup-panel";
import { ErasePanel } from "@/features/backup/components/erase-panel";
import { ChurchForm } from "@/features/church/components/church-form";
import { StorageBreakdown } from "@/features/church/components/storage-usage";
import { fileSize } from "@/lib/format";
import { requireSession } from "@/server/dal";

export const metadata: Metadata = { title: "Ajustes" };

export default async function SettingsPage() {
  const { session, repos } = await requireSession();
  const [church, sessions] = await Promise.all([repos.church.get(), repos.auth.listSessions()]);

  return (
    <div className="mx-auto flex max-w-settings flex-col gap-8">
      <PageHeader title="Ajustes" description="Tu cuenta, los datos de tu iglesia y su espacio." />
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
      <Panel title="Iglesia">
        <ChurchForm church={church} />
      </Panel>
      <Panel
        title="Almacenamiento"
        description={`Los ${fileSize(church.storage.quotaBytes)} de tu iglesia los comparten las pistas de las canciones, los fondos y la multimedia. Las letras no ocupan espacio.`}
      >
        <StorageBreakdown storage={church.storage} />
      </Panel>
      <Panel
        title="Respaldo"
        description="Guarda tus canciones (letra y enlaces) y tus videos de YouTube en un archivo, e impórtalo en esta o en otra cuenta. Las pistas, imágenes y videos subidos no viajan en el archivo."
      >
        <BackupPanel />
      </Panel>
      <Panel
        title="Empezar de cero"
        description="Elimina de golpe lo que elijas. Se borra también del servicio en curso."
      >
        <ErasePanel />
      </Panel>
      <Panel
        title="Eliminar cuenta"
        description="Borra tu cuenta y todo lo de tu iglesia, también los archivos subidos. No se puede deshacer."
      >
        <DeleteAccountPanel />
      </Panel>
    </div>
  );
}
