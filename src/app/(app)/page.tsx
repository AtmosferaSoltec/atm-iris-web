import { Plus, Upload } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton, TileSkeleton } from "@/components/ui/skeleton";
import { nextService } from "@/domain/next-service";
import { Greeting } from "@/features/home/components/greeting";
import {
  MediaTile,
  PeopleTile,
  ServicesTile,
  SettingsTile,
  SongsTile,
  TimesTile,
} from "@/features/home/components/home-tiles";
import { NextServiceCard } from "@/features/home/components/next-service-card";
import { requireSession } from "@/server/dal";
import type { Repositories } from "@/server/repositories/types";

export const metadata: Metadata = { title: "Inicio" };

export default async function HomePage() {
  const { repos } = await requireSession();
  const church = await repos.church.get();
  const { modules } = church;
  const now = new Date();

  return (
    <div className="mx-auto flex max-w-content flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <Greeting churchName={church.name} timeZone={church.timezone} now={now} />
        <div className="flex flex-wrap gap-3">
          {modules.multimedia && (
            <ButtonLink href="/multimedia" variant="secondary" icon={<Upload className="size-4" />}>
              Subir multimedia
            </ButtonLink>
          )}
          <ButtonLink href="/letras/nueva" icon={<Plus className="size-4" />}>
            Nueva letra
          </ButtonLink>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-72 rounded-2xl" />}>
        <NextServiceSection
          repos={repos}
          timeZone={church.timezone}
          now={now}
          timeControl={modules.timeControl}
        />
      </Suspense>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Suspense fallback={<TileSkeleton />}>
          <SongsTile repos={repos} />
        </Suspense>
        {modules.multimedia && (
          <Suspense fallback={<TileSkeleton />}>
            <MediaTile repos={repos} storage={church.storage} />
          </Suspense>
        )}
        <Suspense fallback={<TileSkeleton />}>
          <ServicesTile repos={repos} timeControl={modules.timeControl} />
        </Suspense>
        {modules.timeControl && (
          <>
            <Suspense fallback={<TileSkeleton />}>
              <TimesTile repos={repos} timeZone={church.timezone} />
            </Suspense>
            <Suspense fallback={<TileSkeleton />}>
              <PeopleTile repos={repos} />
            </Suspense>
          </>
        )}
        <SettingsTile modules={modules} />
      </div>
    </div>
  );
}

async function NextServiceSection({
  repos,
  timeZone,
  now,
  timeControl,
}: {
  repos: Repositories;
  timeZone: string;
  now: Date;
  timeControl: boolean;
}) {
  const types = await repos.serviceTypes.list();
  return <NextServiceCard next={nextService(types, now, timeZone)} timeControl={timeControl} />;
}
