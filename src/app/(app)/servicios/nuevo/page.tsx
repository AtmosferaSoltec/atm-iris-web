import type { Metadata } from "next";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { ServiceTypeEditor } from "@/features/service-types/components/service-type-editor";
import { requireSession } from "@/server/dal";

export const metadata: Metadata = { title: "Nuevo servicio" };

export default async function NewServiceTypePage() {
  const { repos } = await requireSession();
  const [people, modules] = await Promise.all([repos.people.list(), repos.modules.get()]);

  return (
    <div className="mx-auto flex max-w-content flex-col gap-8">
      <BackLink href="/servicios">Servicios</BackLink>
      <PageHeader title="Nuevo servicio" />
      <ServiceTypeEditor people={people} timeControlEnabled={modules.timeControl} />
    </div>
  );
}
