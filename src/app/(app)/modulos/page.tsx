import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Surface } from "@/components/ui/surface";
import { ModuleSettings } from "@/features/modules/components/module-settings";
import { requireSession } from "@/server/dal";

export const metadata: Metadata = { title: "Módulos" };

export default async function ModulesPage() {
  const { repos } = await requireSession();
  const modules = await repos.modules.get();

  return (
    <div className="mx-auto flex max-w-settings flex-col gap-8">
      <PageHeader
        title="Módulos"
        description="Elige qué partes de Iris usa tu iglesia. Lo que apagues desaparece de la consola."
      />
      <Surface className="p-6 sm:p-8">
        <ModuleSettings initialModules={modules} />
      </Surface>
    </div>
  );
}
