import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { ChurchForm } from "@/features/church/components/church-form";
import { ModuleSettings } from "@/features/church/components/module-settings";
import { StorageUsage } from "@/features/church/components/storage-usage";
import { requireSession } from "@/server/dal";

export const metadata: Metadata = { title: "Ajustes" };

export default async function SettingsPage() {
  const { repos } = await requireSession();
  const church = await repos.church.get();

  return (
    <div className="mx-auto flex max-w-settings flex-col gap-8">
      <PageHeader title="Ajustes" description="Los datos de tu iglesia y qué partes de Iris usa." />
      <Panel title="Iglesia">
        <ChurchForm church={church} />
      </Panel>
      <Panel
        title="Módulos"
        description="Elige qué partes de Iris usa tu iglesia. Lo que apagues desaparece de la consola."
      >
        <ModuleSettings initialModules={church.modules} />
      </Panel>
      <Panel
        title="Almacenamiento"
        description="Lo que ocupan los archivos de multimedia de la biblioteca."
      >
        <StorageUsage usedBytes={church.storage.usedBytes} quotaBytes={church.storage.quotaBytes} />
      </Panel>
    </div>
  );
}
