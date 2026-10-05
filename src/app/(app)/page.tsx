import { Plus, Upload, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button";
import { PermissionGate } from "@/components/ui/permission-gate";
import { Skeleton, TileSkeleton } from "@/components/ui/skeleton";
import { nextService } from "@/domain/next-service";
import { Greeting } from "@/features/home/components/greeting";
import {
  MediaTile,
  PeopleTile,
  ServicesTile,
  SettingsTile,
  SongsTile,
  TeamTile,
  TimesTile,
} from "@/features/home/components/home-tiles";
import { NextServiceCard } from "@/features/home/components/next-service-card";
import { can } from "@/lib/permissions";
import { requireSession } from "@/server/dal";
import type { Repositories } from "@/server/repositories/types";

export const metadata: Metadata = { title: "Inicio" };

export default async function HomePage() {
  const { session, repos } = await requireSession();
  const church = await repos.church.get();
  const { modules } = church;
  const now = new Date();

  return (
    <div className="mx-auto flex max-w-content flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <Greeting churchName={church.name} timeZone={church.timezone} now={now} />
        <div className="flex flex-wrap gap-3">
          <PermissionGate session={session} permission="members.manage">
            <ButtonLink href="/equipo" variant="secondary" icon={<UserPlus className="size-4" />}>
              Invitar
            </ButtonLink>
          </PermissionGate>
          {modules.multimedia && (
            <PermissionGate session={session} permission="media.manage">
              <ButtonLink
                href="/multimedia"
                variant="secondary"
                icon={<Upload className="size-4" />}
              >
                Subir multimedia
              </ButtonLink>
            </PermissionGate>
          )}
          <PermissionGate session={session} permission="songs.manage">
            <ButtonLink href="/canciones/nueva" icon={<Plus className="size-4" />}>
              Subir canción
            </ButtonLink>
          </PermissionGate>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-72 rounded-2xl" />}>
        <NextServiceSection
          repos={repos}
          timeZone={church.timezone}
          now={now}
          timeControl={modules.timeControl}
          canEditServices={can(session, "serviceTypes.manage")}
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
        <Suspense fallback={<TileSkeleton />}>
          <TeamTile repos={repos} session={session} />
        </Suspense>
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
  canEditServices,
}: {
  repos: Repositories;
  timeZone: string;
  now: Date;
  timeControl: boolean;
  canEditServices: boolean;
}) {
  const [types, people] = await Promise.all([repos.serviceTypes.list(), repos.people.list()]);
  return (
    <NextServiceCard
      next={nextService(types, now, timeZone)}
      people={people}
      timeControl={timeControl}
      canEditServices={canEditServices}
    />
  );
}
