"use client";

import {
  Check,
  CirclePlay,
  Film,
  Image as ImageIcon,
  Music,
  Plus,
  Quote,
  Search,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Spinner } from "@/components/ui/spinner";
import { Surface } from "@/components/ui/surface";
import { TextField } from "@/components/ui/text-field";
import { clock } from "@/lib/format";
import { nameKey } from "@/lib/text";
import type { LibraryEntry } from "../model";
import type { LiveConsole } from "../use-live-console";
import { YouTubeDialog } from "./youtube-dialog";

type Tab = "song" | "media";

export const ENTRY_ICONS = {
  song: { icon: Quote, color: "var(--color-ember)" },
  track: { icon: Music, color: "var(--color-success)" },
  image: { icon: ImageIcon, color: "var(--color-indigo)" },
  video: { icon: Film, color: "var(--color-rose)" },
  youtube: { icon: CirclePlay, color: "var(--color-danger)" },
} as const;

/** BIBLIOTECA (IRIS_SPEC §6.4 on the desktop): always open, "+" or double click adds to the service. */
export function LibraryPanel({ ctrl, library }: { ctrl: LiveConsole; library: LibraryEntry[] }) {
  const [tab, setTab] = useState<Tab>("song");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [isAddingYouTube, setIsAddingYouTube] = useState(false);
  const [, startAdd] = useTransition();
  const added = useMemo(() => new Set(ctrl.items.map((item) => item.refId)), [ctrl.items]);

  const entries = useMemo(() => {
    const key = nameKey(query);
    return library.filter(
      (entry) =>
        entry.kind === tab && (!key || nameKey(`${entry.title} ${entry.subtitle}`).includes(key)),
    );
  }, [library, tab, query]);

  function add(entry: LibraryEntry) {
    if (added.has(entry.id) || adding) return;
    setAdding(entry.id);
    startAdd(async () => {
      await ctrl.add(entry.kind, entry.id);
      setAdding(null);
    });
  }

  return (
    <Surface className="flex min-h-0 flex-col gap-3 p-4">
      <h2 className="px-1 eyebrow text-ink-2">Biblioteca</h2>
      <SegmentedControl
        label="Tipo de contenido"
        value={tab}
        onChange={setTab}
        options={[
          { value: "song", label: "Canciones" },
          { value: "media", label: "Multimedia" },
        ]}
      />
      <TextField
        id="library-search"
        type="search"
        aria-label="Buscar en la biblioteca"
        placeholder="Buscar"
        icon={<Search />}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {tab === "media" && (
        <Button
          variant="secondary"
          size="sm"
          icon={<CirclePlay className="size-4 text-danger" />}
          onClick={() => setIsAddingYouTube(true)}
        >
          Agregar video de YouTube
        </Button>
      )}
      {isAddingYouTube && (
        <YouTubeDialog
          onClose={() => setIsAddingYouTube(false)}
          onAdd={(video) => {
            ctrl.addYouTube(video);
            setIsAddingYouTube(false);
          }}
        />
      )}
      <ul className="-mx-2 flex min-h-0 flex-1 flex-col overflow-y-auto">
        {entries.map((entry) => {
          const { icon: Icon, color } = ENTRY_ICONS[entry.icon];
          const isAdded = added.has(entry.id);
          return (
            <li key={entry.id}>
              <div
                onDoubleClick={() => add(entry)}
                className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-surface"
                title={isAdded ? "Ya está en el servicio" : "Doble clic para agregarlo al servicio"}
              >
                <Icon aria-hidden className="size-4 shrink-0" style={{ color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{entry.title}</span>
                  {entry.subtitle && (
                    <span className="block truncate text-xs text-ink-2">{entry.subtitle}</span>
                  )}
                </span>
                {entry.durationSeconds !== null && entry.icon !== "song" && (
                  <span className="font-mono text-xs text-ink-2 tabular-nums">
                    {clock(entry.durationSeconds)}
                  </span>
                )}
                {isAdded ? (
                  <Check aria-label="En el servicio" className="size-4 shrink-0 text-success" />
                ) : (
                  <button
                    type="button"
                    onClick={() => add(entry)}
                    aria-label={`Agregar «${entry.title}» al servicio`}
                    className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-full text-ink-2 ring-1 ring-line transition ring-inset hover:bg-surface-raised hover:text-ink"
                  >
                    {adding === entry.id ? (
                      <Spinner className="size-3.5" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                  </button>
                )}
              </div>
            </li>
          );
        })}
        {entries.length === 0 && (
          <li className="px-2 py-8 text-center text-sm text-ink-2">
            {query
              ? "Sin resultados."
              : tab === "song"
                ? "Aún no hay canciones. Agrégalas en Canciones."
                : "Aún no hay multimedia. Súbela en Multimedia."}
          </li>
        )}
      </ul>
    </Surface>
  );
}
