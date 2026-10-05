import { ListMusic, Settings2, Timer, Users, Library, Plus } from "lucide-react";
import { AvatarStack } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Chip, ColorDot } from "@/components/ui/chip";
import { Tile } from "@/components/ui/tile";
import { tracksTime } from "@/domain/rules";
import { Greeting } from "@/features/home/components/greeting";
import { compareNames, plural } from "@/lib/text";
import { requireSession } from "@/server/dal";

const MODULE_LABELS = [
  { key: "bible", label: "Biblia" },
  { key: "multimedia", label: "Multimedia" },
  { key: "timeControl", label: "Control de tiempo" },
] as const;

export default async function HomePage() {
  const { session, repos } = await requireSession();
  const [songs, types, people, modules] = await Promise.all([
    repos.songs.list(),
    repos.serviceTypes.list(),
    repos.people.list(),
    repos.modules.get(),
  ]);
  const recentSongs = [...songs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);

  return (
    <div className="mx-auto flex max-w-content flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <Greeting churchName={session.churchName} />
        <ButtonLink href="/canciones/nueva" size="lg" icon={<Plus className="size-4" />}>
          Subir canción
        </ButtonLink>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Tile
          href="/canciones"
          icon={<ListMusic />}
          color="var(--color-ember)"
          title="Canciones"
          subtitle={plural(songs.length, "canción", "canciones")}
        >
          {recentSongs.length > 0 && (
            <ul className="flex flex-col gap-2">
              {recentSongs.map((song) => (
                <li key={song.id} className="flex items-baseline gap-2 text-sm">
                  <span className="truncate font-serif text-[15px] italic">{song.title}</span>
                  <span className="shrink-0 text-ink-3">· {song.author || "Sin autor"}</span>
                </li>
              ))}
            </ul>
          )}
        </Tile>

        <Tile
          href="/servicios"
          icon={<Library />}
          color="var(--color-violet)"
          title="Servicios"
          subtitle={plural(types.length, "tipo de servicio", "tipos de servicio")}
        >
          <ul className="flex flex-col gap-2.5">
            {types.slice(0, 4).map((type) => (
              <li key={type.id} className="flex items-center gap-2.5 text-sm">
                <ColorDot color={type.color} />
                <span className="min-w-0 flex-1 truncate font-medium">{type.name}</span>
                {modules.timeControl && tracksTime(type) ? (
                  <Chip color="var(--color-success)" icon={<Timer />}>
                    Con tiempos
                  </Chip>
                ) : (
                  <Chip>Solo proyección</Chip>
                )}
              </li>
            ))}
          </ul>
        </Tile>
      </div>

      <div className={modules.timeControl ? "grid gap-5 md:grid-cols-2" : "grid gap-5"}>
        {modules.timeControl && (
          <Tile
            href="/personas"
            icon={<Users />}
            color="var(--color-coral)"
            title="Personas"
            subtitle="Responsables de bloques"
          >
            <div className="flex items-center justify-between gap-4">
              <AvatarStack
                names={[...people].sort((a, b) => compareNames(a.name, b.name)).map((p) => p.name)}
              />
              <span className="text-sm text-ink-3">
                {plural(people.length, "persona registrada", "personas registradas")}
              </span>
            </div>
          </Tile>
        )}
        <Tile
          href="/modulos"
          icon={<Settings2 />}
          color="var(--color-indigo)"
          title="Módulos"
          subtitle="Elige qué usar"
        >
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <li className="flex items-center gap-2">
              <ColorDot color="var(--color-success)" /> Letras
            </li>
            {MODULE_LABELS.map(({ key, label }) => (
              <li key={key} className="flex items-center gap-2">
                <ColorDot color={modules[key] ? "var(--color-success)" : "var(--color-ink-3)"} />
                {label}
                <span className="text-ink-3">{modules[key] ? "Activo" : "Apagado"}</span>
              </li>
            ))}
          </ul>
        </Tile>
      </div>
    </div>
  );
}
