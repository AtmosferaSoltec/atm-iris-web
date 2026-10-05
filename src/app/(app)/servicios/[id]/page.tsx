import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { ServiceTypeEditor } from "@/features/service-types/components/service-type-editor";
import { requireSession } from "@/server/dal";

export const metadata: Metadata = { title: "Editar servicio" };

export default async function EditServiceTypePage({ params }: PageProps<"/servicios/[id]">) {
  const { id } = await params;
  const { repos } = await requireSession();
  const [serviceType, people, modules] = await Promise.all([
    repos.serviceTypes.get(id),
    repos.people.list(),
    repos.modules.get(),
  ]);
  if (!serviceType) notFound();

  return (
    <div className="mx-auto flex max-w-content flex-col gap-8">
      <BackLink href="/servicios">Servicios</BackLink>
      <PageHeader title="Editar servicio" />
      <ServiceTypeEditor
        serviceType={serviceType}
        people={people}
        timeControlEnabled={modules.timeControl}
      />
    </div>
  );
}
