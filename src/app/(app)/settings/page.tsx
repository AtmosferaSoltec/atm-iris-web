import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { ChurchForm } from "@/features/church/components/church-form";
import { StorageBreakdown } from "@/features/church/components/storage-usage";
import { fileSize } from "@/lib/format";
import { requireSession } from "@/server/dal";

export const metadata: Metadata = { title: "Ajustes" };

export default async function SettingsPage() {
  const { repos } = await requireSession();
  const church = await repos.church.get();

  return (
    <div className="mx-auto flex max-w-settings flex-col gap-8">
      <PageHeader title="Ajustes" description="Los datos de tu iglesia y su espacio." />
      <Panel title="Iglesia">
        <ChurchForm church={church} />
      </Panel>
      <Panel
        title="Almacenamiento"
        description={`Los ${fileSize(church.storage.quotaBytes)} de tu iglesia los comparten las pistas de las canciones, los fondos y la multimedia. Las letras no ocupan espacio.`}
      >
        <StorageBreakdown storage={church.storage} />
      </Panel>
    </div>
  );
}
