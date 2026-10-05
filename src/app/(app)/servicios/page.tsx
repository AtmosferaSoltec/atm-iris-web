import { Library, Plus } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Surface } from "@/components/ui/surface";
import { ServiceTypeCard } from "@/features/service-types/components/service-type-card";
import { requireSession } from "@/server/dal";

export const metadata: Metadata = { title: "Servicios" };

export default async function ServiceTypesPage() {
  const { repos } = await requireSession();
  const [types, modules] = await Promise.all([repos.serviceTypes.list(), repos.modules.get()]);

  return (
    <div className="mx-auto flex max-w-content flex-col gap-8">
      <PageHeader
        title="Servicios"
        description="Crea los servicios de tu iglesia y, si quieres, sus bloques de tiempo."
        actions={
          <ButtonLink href="/servicios/nuevo" icon={<Plus className="size-4" />}>
            Nuevo servicio
          </ButtonLink>
        }
      />
      {types.length === 0 ? (
        <Surface>
          <EmptyState
            icon={<Library />}
            title="Aún no hay servicios"
            description="Configura el culto general, la reunión de jóvenes o la escuela dominical."
            action={<ButtonLink href="/servicios/nuevo">Crear el primero</ButtonLink>}
          />
        </Surface>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
          {types.map((type) => (
            <li key={type.id} className="flex">
              <ServiceTypeCard type={type} timeControlEnabled={modules.timeControl} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
