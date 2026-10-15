"use client";

import { ChevronRight, Download, ListMusic, Plus, Quote, Search, Upload } from "lucide-react";
import Link from "next/link";
import { debounce, useQueryStates } from "nuqs";
import { useRef, useState, useTransition } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Surface } from "@/components/ui/surface";
import { TextField } from "@/components/ui/text-field";
import { toast } from "@/components/ui/toaster";
import type { Paginated, SongSummary } from "@/domain/models";
import { cn } from "@/lib/cn";
import { songSearchParams } from "@/lib/search-params";
import { plural } from "@/lib/text";
import { useSlashFocus } from "@/lib/use-slash-focus";
import { exportSongs, importSongs } from "../actions";

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
  const importInput = useRef<HTMLInputElement>(null);
  const [isExporting, startExport] = useTransition();
  const [isImporting, startImport] = useTransition();
  useSlashFocus(searchRef);

  const isFiltered = params.search.trim().length > 0;

  function onExport() {
    startExport(async () => {
      const result = await exportSongs();
      if (result.error || !result.songs) {
        toast.error(result.error ?? "No pudimos exportar las letras.");
        return;
      }
      if (result.songs.length === 0) {
        toast.error("Aún no hay letras para exportar.");
        return;
      }
      const blob = new Blob([JSON.stringify({ songs: result.songs }, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `letras-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Se exportó ${plural(result.songs.length, "letra")}`);
    });
  }

  async function onImportFile(file: File) {
    let data: unknown;
    try {
      data = JSON.parse(await file.text());
    } catch {
      toast.error("Ese archivo no es un JSON válido.");
      return;
    }
    startImport(async () => {
      const result = await importSongs(data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.failed > 0) {
        toast.error(`Se importaron ${result.imported}, ${result.failed} no se pudieron guardar.`);
      } else {
        toast.success(`Se importó ${plural(result.imported, "letra")}`);
      }
    });
  }

  return (
    <div className="mx-auto flex max-w-content flex-col gap-8">
      <PageHeader
        title="Letras"
        description="Las letras que se proyectan en el TV. Lo que guardes aquí aparece en la consola al preparar el servicio."
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Download className="size-4" />}
              isLoading={isExporting}
              onClick={onExport}
            >
              Exportar
            </Button>
            <Button
              variant="secondary"
              icon={<Upload className="size-4" />}
              isLoading={isImporting}
              onClick={() => importInput.current?.click()}
            >
              Importar
            </Button>
            <input
              ref={importInput}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onImportFile(file);
                event.target.value = "";
              }}
            />
            <ButtonLink href="/letras/nueva" icon={<Plus className="size-4" />}>
              Nueva letra
            </ButtonLink>
          </>
        }
      />

      <Surface className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 border-b border-line p-4 sm:px-6">
          <TextField
            ref={searchRef}
            id="song-search"
            type="search"
            aria-label="Buscar letras"
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
              title="Aún no hay letras"
              description="Usa «Nueva letra» para escribir la primera."
            />
          ) : songs.data.length === 0 ? (
            <EmptyState
              icon={<Search />}
              title="Sin resultados"
              description={`No encontramos letras para «${params.search}».`}
            />
          ) : (
            <ul className="divide-y divide-line">
              {songs.data.map((song) => (
                <li key={song.id}>
                  <Link
                    href={`/letras/${song.id}`}
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
