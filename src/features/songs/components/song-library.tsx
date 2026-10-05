"use client";

import { ChevronRight, FileUp, ListMusic, Plus, Quote, Search } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Surface } from "@/components/ui/surface";
import { TextField } from "@/components/ui/text-field";
import type { Song } from "@/domain/models";
import { firstLine } from "@/lib/lyrics";
import { compareNames, nameKey, plural } from "@/lib/text";
import { ImportSongsDialog } from "./import-songs-dialog";

export function SongLibrary({ songs }: { songs: Song[] }) {
  const [query, setQuery] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const key = nameKey(deferredQuery);
  const visible = songs
    .filter(
      (song) =>
        !key ||
        nameKey(`${song.title} ${song.author} ${firstLine(song.sections) ?? ""}`).includes(key),
    )
    .sort((a, b) => compareNames(a.title, b.title));

  return (
    <div className="mx-auto flex max-w-content flex-col gap-8">
      <PageHeader
        title="Canciones"
        description="Las letras de tu biblioteca. Lo que guardes aquí aparece en la consola al preparar el servicio."
        actions={
          <>
            <Button
              variant="secondary"
              icon={<FileUp className="size-4" />}
              onClick={() => setIsImporting(true)}
            >
              Importar .txt
            </Button>
            <ButtonLink href="/canciones/nueva" icon={<Plus className="size-4" />}>
              Nueva canción
            </ButtonLink>
          </>
        }
      />

      <Surface className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 border-b border-line p-4 sm:px-6">
          <TextField
            id="song-search"
            type="search"
            aria-label="Buscar canciones"
            placeholder="Título, autor o primera línea"
            icon={<Search />}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            containerClassName="w-full max-w-md"
          />
          <span className="ml-auto text-sm text-ink-3 tabular-nums">
            {plural(songs.length, "canción", "canciones")}
          </span>
        </div>

        {songs.length === 0 ? (
          <EmptyState
            icon={<ListMusic />}
            title="Aún no hay canciones"
            description="Crea la primera o importa varias a la vez desde archivos .txt."
            action={<ButtonLink href="/canciones/nueva">Crear la primera</ButtonLink>}
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<Search />}
            title="Sin resultados"
            description={`No encontramos canciones para «${query}».`}
          />
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((song) => (
              <li key={song.id}>
                <Link
                  href={`/canciones/${song.id}`}
                  className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-surface sm:px-6"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-ember/14 text-ember">
                    <Quote aria-hidden className="size-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{song.title}</p>
                    <p className="truncate text-sm text-ink-3">
                      {song.author || "Sin autor"} · {plural(song.sections.length, "diapositiva")}
                    </p>
                  </div>
                  <p className="hidden min-w-0 flex-1 truncate font-serif text-[15px] text-ink-2 italic md:block">
                    {firstLine(song.sections)}
                  </p>
                  <ChevronRight
                    aria-hidden
                    className="size-4 shrink-0 text-ink-3 transition group-hover:translate-x-0.5 group-hover:text-ink"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Surface>

      <ImportSongsDialog
        open={isImporting}
        onClose={() => setIsImporting(false)}
        existingTitles={songs.map((s) => s.title)}
      />
    </div>
  );
}
