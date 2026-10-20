import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Surface } from "@/components/ui/surface";
import { PeopleManager } from "@/features/people/components/people-manager";
import { requireSession } from "@/server/dal";

export const metadata: Metadata = { title: "Personas" };

export default async function PeoplePage() {
  const { repos } = await requireSession();
  const people = await repos.people.list();

  return (
    <div className="mx-auto flex max-w-settings flex-col gap-8">
      <PageHeader title="Personas" description="Quienes dirigen los bloques de tus servicios." />
      <Surface className="p-6 sm:p-8">
        <PeopleManager people={people} />
      </Surface>
    </div>
  );
}
