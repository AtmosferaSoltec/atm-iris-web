import { Timer } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Surface } from "@/components/ui/surface";
import { blockCountsByPerson } from "@/domain/rules";
import { PeopleManager } from "@/features/people/components/people-manager";
import { compareNames } from "@/lib/text";
import { requireSession } from "@/server/dal";

export const metadata: Metadata = { title: "Personas" };

export default async function PeoplePage() {
  const { repos } = await requireSession();
  const [modules, people, records] = await Promise.all([
    repos.modules.get(),
    repos.people.list(),
    repos.records.list(),
  ]);

  return (
    <div className="mx-auto flex max-w-settings flex-col gap-8">
      <PageHeader title="Personas" description="Quienes dirigen los bloques de tus servicios." />
      <Surface className="p-6 sm:p-8">
        {modules.timeControl ? (
          <PeopleManager
            people={[...people].sort((a, b) => compareNames(a.name, b.name))}
            blockCounts={Object.fromEntries(blockCountsByPerson(records))}
          />
        ) : (
          <EmptyState
            icon={<Timer />}
            title="El control de tiempo está apagado"
            description="Las personas se usan como responsables de los bloques de tiempo. Actívalo en Módulos para administrarlas."
            action={
              <ButtonLink href="/modulos" variant="secondary">
                Ir a Módulos
              </ButtonLink>
            }
          />
        )}
      </Surface>
    </div>
  );
}
