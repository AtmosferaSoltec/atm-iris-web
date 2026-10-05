import { Library, Plus } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PermissionGate } from "@/components/ui/permission-gate";
import { Surface } from "@/components/ui/surface";
import { ServiceTypeCard } from "@/features/service-types/components/service-type-card";
import { can } from "@/lib/permissions";
import { requireSession } from "@/server/dal";

export const metadata: Metadata = { title: "Servicios" };

export default async function ServiceTypesPage() {
  const { session, repos } = await requireSession();
  const [types, { modules }] = await Promise.all([repos.serviceTypes.list(), repos.church.get()]);
  const canEdit = can(session, "serviceTypes.manage");

  return (
    <div className="mx-auto flex max-w-content flex-col gap-8">
      <PageHeader
        title="Servicios"
        description="Crea los servicios de tu iglesia y, si quieres, sus bloques de tiempo."
        actions={
          <PermissionGate session={session} permission="serviceTypes.manage">
            <ButtonLink href="/servicios/nuevo" icon={<Plus className="size-4" />}>
              Nuevo servicio
            </ButtonLink>
          </PermissionGate>
        }
      />
      {types.length === 0 ? (
        <Surface>
          <EmptyState
            icon={<Library />}
            title="Aún no hay servicios"
            description="Configura el culto general, la reunión de jóvenes o la escuela dominical."
            action={
              canEdit ? (
                <ButtonLink href="/servicios/nuevo">Crear el primero</ButtonLink>
              ) : undefined
            }
          />
        </Surface>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-5">
          {types.map((type) => (
            <li key={type.id} className="flex">
              <ServiceTypeCard
                type={type}
                timeControlEnabled={modules.timeControl}
                canEdit={canEdit}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
