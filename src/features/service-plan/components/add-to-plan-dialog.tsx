"use client";

import { Quote, Search } from "lucide-react";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TextField } from "@/components/ui/text-field";
import { toast } from "@/components/ui/toaster";
import type { MediaAsset, SongSummary } from "@/domain/models";
import { KIND_ICONS, KIND_LABELS } from "@/features/media/media-format";
import { addPlanItem, searchMediaForPlan, searchSongsForPlan } from "../actions";

type Tab = "song" | "media";

export function AddToPlanDialog({
  canAddMedia,
  existingRefIds,
  onClose,
}: {
  canAddMedia: boolean;
  existingRefIds: string[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("song");
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState<SongSummary[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [isSearching, startSearch] = useTransition();
  const [addingId, setAddingId] = useState<string | null>(null);
  const existing = new Set(existingRefIds);

  // Debounced: a search per keystroke would hit the API (or the mock) on every letter.
  useEffect(() => {
    const handle = setTimeout(() => {
      startSearch(async () => {
        if (tab === "song") setSongs(await searchSongsForPlan(query));
        else setMedia(await searchMediaForPlan(query));
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [tab, query]);

  function add(kind: Tab, refId: string, title: string) {
    setAddingId(refId);
    startSearch(async () => {
      const result = await addPlanItem(kind, refId);
      setAddingId(null);
      if (result.error) toast.error(result.error);
      else toast.success(`Se agregó «${title}» al plan`);
    });
  }

  const results =
    tab === "song"
      ? songs.map((song) => ({
          id: song.id,
          title: song.title,
          subtitle: song.author || null,
          icon: <Quote className="size-4" />,
        }))
      : media.map((asset) => {
          const Icon = KIND_ICONS[asset.kind];
          return {
            id: asset.id,
            title: asset.title,
            subtitle: KIND_LABELS[asset.kind].singular,
            icon: <Icon className="size-4" />,
          };
        });

  return (
    <Dialog
      open
      onClose={onClose}
      size="md"
      title="Agregar al plan"
      description="Busca y elige lo que vas a presentar en el próximo servicio."
    >
      <div className="flex flex-col gap-4 pb-4">
        {canAddMedia && (
          <SegmentedControl
            label="Tipo de contenido"
            value={tab}
            onChange={(value) => {
              setTab(value);
              setQuery("");
            }}
            options={[
              { value: "song", label: "Letras" },
              { value: "media", label: "Multimedia" },
            ]}
          />
        )}

        <TextField
          id="plan-search"
          icon={<Search className="size-4" />}
          placeholder={tab === "song" ? "Buscar canción…" : "Buscar multimedia…"}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoFocus
        />

        <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {results.map((result) => (
            <ResultRow
              key={result.id}
              icon={result.icon}
              title={result.title}
              subtitle={result.subtitle}
              isAdded={existing.has(result.id)}
              isAdding={addingId === result.id}
              onAdd={() => add(tab, result.id, result.title)}
            />
          ))}
          {!isSearching && results.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-ink-2">
              {query
                ? "Sin resultados."
                : tab === "song"
                  ? "Aún no hay canciones."
                  : "Aún no hay multimedia."}
            </p>
          )}
        </ul>
      </div>
    </Dialog>
  );
}

function ResultRow({
  icon,
  title,
  subtitle,
  isAdded,
  isAdding,
  onAdd,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string | null;
  isAdded: boolean;
  isAdding: boolean;
  onAdd: () => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-surface">
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-surface text-ink-3 ring-1 ring-line">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{title}</span>
        {subtitle && <span className="block truncate text-xs text-ink-2">{subtitle}</span>}
      </span>
      <Button
        size="sm"
        variant={isAdded ? "ghost" : "secondary"}
        disabled={isAdded || isAdding}
        isLoading={isAdding}
        onClick={onAdd}
      >
        {isAdded ? "Agregado" : "Agregar"}
      </Button>
    </li>
  );
}
