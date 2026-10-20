import { Clapperboard, Library, Quote, Settings2, Timer, Users } from "lucide-react";
import { AvatarStack } from "@/components/ui/avatar";
import { Chip, ColorDot } from "@/components/ui/chip";
import { Tile } from "@/components/ui/tile";
import type { Church } from "@/domain/models";
import { SECTION_KINDS } from "@/domain/media-rules";
import { tracksTime } from "@/domain/rules";
import { recordTotals, serviceName } from "@/domain/time-statistics";
import { StorageUsage } from "@/features/church/components/storage-usage";
import { overtime, shortWeekdayDate } from "@/lib/format";
import { plural } from "@/lib/text";
import type { Repositories } from "@/server/repositories/types";

// Each tile loads its own data inside a Suspense boundary (see app/(app)/page.tsx),
// so a slow call doesn't hold the rest of the home screen.

type TileProps = { repos: Repositories };

export async function SongsTile({ repos }: TileProps) {
  const songs = await repos.songs.list({ sort: "-updatedAt", limit: 3 });
  return (
    <Tile
      href="/songs"
      icon={<Quote />}
      color="var(--color-ember)"
      title="Canciones"
      subtitle={plural(songs.meta.total, "canción", "canciones")}
    >
      {songs.data.length > 0 && (
        <ul className="flex flex-col gap-2">
          {songs.data.map((song) => (
            <li key={song.id} className="flex items-baseline gap-2 text-sm">
              <span className="truncate font-serif text-[15px] italic">{song.title}</span>
              <span className="shrink-0 text-ink-2">· {song.author || "Sin autor"}</span>
            </li>
          ))}
        </ul>
      )}
    </Tile>
  );
}

export async function MediaTile({ repos, storage }: TileProps & { storage: Church["storage"] }) {
  const files = await repos.media.list({
    kind: SECTION_KINDS.media,
    isBackground: false,
    limit: 1,
  });
  return (
    <Tile
      href="/media"
      icon={<Clapperboard />}
      color="var(--color-rose)"
      title="Multimedia"
      subtitle="Archivos para una ocasión especial"
    >
      <div className="flex flex-col gap-4">
        <dl>
          <dt className="text-xs text-ink-2">Archivos</dt>
          <dd className="text-xl font-semibold tabular-nums">{files.meta.total}</dd>
        </dl>
        <StorageUsage usedBytes={storage.usedBytes} quotaBytes={storage.quotaBytes} />
      </div>
    </Tile>
  );
}

export async function ServicesTile({ repos }: TileProps) {
  const types = await repos.serviceTypes.list();
  return (
    <Tile
      href="/services"
      icon={<Library />}
      color="var(--color-violet)"
      title="Servicios"
      subtitle={plural(types.length, "tipo de servicio", "tipos de servicio")}
    >
      {types.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {types.slice(0, 4).map((type) => (
            <li key={type.id} className="flex items-center gap-2.5 text-sm">
              <ColorDot color={type.color} />
              <span className="min-w-0 flex-1 truncate font-medium">{type.name}</span>
              {tracksTime(type) ? (
                <Chip color="var(--color-success)" icon={<Timer />}>
                  Con tiempos
                </Chip>
              ) : (
                <Chip>Solo proyección</Chip>
              )}
            </li>
          ))}
        </ul>
      )}
    </Tile>
  );
}

export async function PeopleTile({ repos }: TileProps) {
  const people = await repos.people.list();
  return (
    <Tile
      href="/people"
      icon={<Users />}
      color="var(--color-coral)"
      title="Personas"
      subtitle="Responsables de bloques"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        {people.length > 0 && <AvatarStack names={people.map((person) => person.name)} />}
        <span className="text-sm text-ink-2">
          {plural(people.length, "persona registrada", "personas registradas")}
        </span>
      </div>
    </Tile>
  );
}

export async function TimesTile({ repos, timeZone }: TileProps & { timeZone: string }) {
  const [latest, types] = await Promise.all([
    repos.records.list({ limit: 1 }),
    repos.serviceTypes.list(),
  ]);
  const last = latest.data[0];
  const total = latest.meta.total;
  const totals = last ? recordTotals(last) : null;
  return (
    <Tile
      href="/times"
      icon={<Timer />}
      color="var(--color-coral)"
      title="Tiempos"
      subtitle={
        total === 0
          ? "Aún no hay registros"
          : plural(total, "servicio registrado", "servicios registrados")
      }
    >
      {last && totals && (
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">{serviceName(last, types)}</span>
          <span className="text-ink-2">· {shortWeekdayDate(last.date, timeZone)} ·</span>
          {totals.overtime > 0 ? (
            <Chip color="var(--color-danger)">{overtime(totals.overtime)}</Chip>
          ) : (
            <Chip color="var(--color-success)">A tiempo</Chip>
          )}
        </p>
      )}
    </Tile>
  );
}

/** Ajustes: the church's settings and how much of its space it uses. */
export function SettingsTile({ storage }: { storage: Church["storage"] }) {
  return (
    <Tile
      href="/settings"
      icon={<Settings2 />}
      color="var(--color-indigo)"
      title="Ajustes"
      subtitle="Iglesia y almacenamiento"
    >
      <StorageUsage usedBytes={storage.usedBytes} quotaBytes={storage.quotaBytes} />
    </Tile>
  );
}
