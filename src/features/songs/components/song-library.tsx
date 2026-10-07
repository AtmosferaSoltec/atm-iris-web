"use client";

import { ChevronRight, ListMusic, Plus, Quote, Search } from "lucide-react";
import Link from "next/link";
import { debounce, useQueryStates } from "nuqs";
import { useRef, useState, useTransition } from "react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Surface } from "@/components/ui/surface";
import { TextField } from "@/components/ui/text-field";
import type { Paginated, SongSummary } from "@/domain/models";
import { cn } from "@/lib/cn";
import { songSearchParams } from "@/lib/search-params";
import { plural } from "@/lib/text";
import { useSlashFocus } from "@/lib/use-slash-focus";

type Props = { songs: Paginated<SongSummary> };

/** Search and page live in the URL; the server loads each result page. */
export function SongLibrary({ songs }: Props) {
  const [isLoading, startTransition] = useTransition();
  const [params, setParams] = useQueryStates(songSearchParams, {
    shallow: false,
    startTransition,
  });
  // The field answers at once; the URL (and the server) follow 300 ms later.
  const [query, setQuery] = useState(params.search);
  const searchRef = useRef<HTMLInputElement>(null);
  useSlashFocus(searchRef);

  const isFiltered = params.search.trim().length > 0;

  return (
    <div className="mx-auto flex max-w-content flex-col gap-8">
      <PageHeader
        title="Canciones"
        description="Las letras de tu biblioteca. Lo que guardes aquí aparece en la consola al preparar el servicio."
        actions={
          <ButtonLink href="/canciones/nueva" icon={<Plus className="size-4" />}>
            Nueva canción
          </ButtonLink>
        }
      />

      <Surface className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 border-b border-line p-4 sm:px-6">
          <TextField
            ref={searchRef}
            id="song-search"
            type="search"
            aria-label="Buscar canciones"
            placeholder="Título, autor o letra"
            icon={<Search />}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              void setParams(
                { search: event.target.value || null, page: null },
                { limitUrlUpdates: event.target.value ? debounce(300) : undefined },
              );
            }}
            containerClassName="w-full sm:max-w-md"
          />
        </div>

        <div className={cn("transition-opacity", isLoading && "opacity-60")} aria-busy={isLoading}>
          {songs.meta.total === 0 && !isFiltered ? (
            <EmptyState
              icon={<ListMusic />}
              title="Aún no hay canciones"
              description="Usa «Nueva canción» para escribir la primera letra."
            />
          ) : songs.data.length === 0 ? (
            <EmptyState
              icon={<Search />}
              title="Sin resultados"
              description={`No encontramos canciones para «${params.search}».`}
            />
          ) : (
            <ul className="divide-y divide-line">
              {songs.data.map((song) => (
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
                      <p className="truncate text-sm text-ink-2">
                        {song.author || "Sin autor"} · {plural(song.sectionCount, "diapositiva")}
                      </p>
                    </div>
                    <p className="hidden min-w-0 flex-1 truncate font-serif text-[15px] text-ink-2 italic md:block">
                      {song.firstLine}
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
        </div>

        <Pagination
          meta={songs.meta}
          onPageChange={(page) => void setParams({ page })}
          className="border-t border-line px-4 py-3 sm:px-6"
        />
      </Surface>
    </div>
  );
}
