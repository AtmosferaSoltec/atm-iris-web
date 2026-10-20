"use client";

import { Search } from "lucide-react";
import { useCallback, useMemo, useState, useTransition, type DragEvent } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Surface } from "@/components/ui/surface";
import { TextField } from "@/components/ui/text-field";
import { UploadQueue } from "@/features/media/components/upload-queue";
import { useMediaUpload } from "@/features/media/upload/use-media-upload";
import { cn } from "@/lib/cn";
import { nameKey } from "@/lib/text";
import type { LibraryEntry } from "../model";
import type { LiveConsole } from "../use-live-console";
import { LibraryDialogs, type LibraryDialog } from "./library-dialogs";
import { LibraryRow } from "./library-row";
import { LibraryTile } from "./library-tile";
import { LibraryToolbar } from "./library-toolbar";
import type { Library } from "./use-library";

type Tab = "song" | "media";
type MediaTab = "image" | "video" | "youtube";

const MEDIA_EMPTY: Record<MediaTab, string> = {
  image: "Aún no hay imágenes. Súbelas con el botón o arrástralas aquí.",
  video: "Aún no hay videos. Súbelos con el botón o arrástralos aquí.",
  youtube: "Aún no hay enlaces de YouTube. Agrega el primero con el botón.",
};

/**
 * BIBLIOTECA (IRIS_SPEC §6.4 on the desktop): always open. "+" or double click adds to the
 * service; songs, files and YouTube links are also made, edited and deleted here, in dialogs
 * over the console. Multimedia has a tab per kind: images, videos and YouTube.
 */
export function LibraryPanel({ ctrl, library }: { ctrl: LiveConsole; library: Library }) {
  const [tab, setTab] = useState<Tab>("song");
  const [mediaTab, setMediaTab] = useState<MediaTab>("image");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<LibraryDialog | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const adding = useAdding(ctrl);
  const { uploaded } = library;
  const upload = useMediaUpload({
    section: "media",
    onUploaded: (asset) => {
      setMediaTab(asset.kind === "video" ? "video" : "image");
      uploaded(asset);
    },
  });
  const added = useMemo(() => new Set(ctrl.items.map((item) => item.refId)), [ctrl.items]);

  const entries = useMemo(() => {
    const key = nameKey(query);
    return library.entries.filter(
      (entry) =>
        (tab === "song" ? entry.kind === "song" : entry.icon === mediaTab) &&
        (!key || nameKey(`${entry.title} ${entry.subtitle}`).includes(key)),
    );
  }, [library.entries, tab, mediaTab, query]);

  const edit = useCallback(
    (entry: LibraryEntry) =>
      setDialog(
        entry.kind === "song" ? { kind: "song", id: entry.id } : { kind: "media", id: entry.id },
      ),
    [],
  );
  const remove = useCallback((entry: LibraryEntry) => setDialog({ kind: "delete", entry }), []);
  const close = useCallback(() => setDialog(null), []);

  // Files dropped anywhere on the panel go up as media.
  function onDrop(event: DragEvent) {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length === 0) return;
    setTab("media");
    const first = event.dataTransfer.files[0];
    setMediaTab(first?.type.startsWith("video/") ? "video" : "image");
    upload.addFiles(event.dataTransfer.files);
  }

  return (
    <Surface
      className={cn(
        "flex min-h-0 flex-col gap-3 p-4 transition",
        isDragging && "ring-2 ring-coral",
      )}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setIsDragging(false);
      }}
      onDrop={onDrop}
    >
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

      {tab === "media" && (
        <SegmentedControl
          label="Tipo de multimedia"
          value={mediaTab}
          onChange={setMediaTab}
          options={[
            { value: "image", label: "Imágenes" },
            { value: "video", label: "Videos" },
            { value: "youtube", label: "YouTube" },
          ]}
        />
      )}

      <LibraryToolbar
        tab={tab === "song" ? "song" : mediaTab}
        onNewSong={() => setDialog({ kind: "song", id: null })}
        onUpload={upload.addFiles}
        onYouTube={() => setDialog({ kind: "youtube" })}
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
      {tab === "media" && mediaTab !== "youtube" && (
        <UploadQueue
          items={upload.items}
          onCancel={upload.cancel}
          onRetry={upload.retry}
          onDismiss={upload.dismiss}
          onClearFinished={upload.clearFinished}
        />
      )}
      <ul
        className={cn(
          "-mx-2 min-h-0 flex-1 overflow-y-auto",
          tab === "media" ? "grid grid-cols-3 content-start gap-2 px-2" : "flex flex-col",
        )}
      >
        {entries.map((entry) => {
          const common = {
            entry,
            isAdded: added.has(entry.id),
            isAdding: adding.id === entry.id,
            onAdd: adding.add,
            onEdit: edit,
            onDelete: remove,
          };
          return (
            <li key={entry.id}>
              {tab === "media" ? (
                <LibraryTile {...common} onShow={ctrl.presentQuick} />
              ) : (
                <LibraryRow {...common} />
              )}
            </li>
          );
        })}
        {entries.length === 0 && (
          <li className="col-span-full px-2 py-8 text-center text-sm text-ink-2">
            {query
              ? "Sin resultados."
              : tab === "song"
                ? "Aún no hay canciones. Crea la primera con «Nueva canción»."
                : MEDIA_EMPTY[mediaTab]}
          </li>
        )}
      </ul>
      <LibraryDialogs dialog={dialog} onClose={close} library={library} />
    </Surface>
  );
}

/** Adding to the service, one at a time, with a spinner on the row being added. */
function useAdding(ctrl: LiveConsole) {
  const [id, setId] = useState<string | null>(null);
  const [, startAdd] = useTransition();
  const { add: addToService } = ctrl;
  const add = useCallback(
    (entry: LibraryEntry) => {
      if (id) return;
      setId(entry.id);
      startAdd(async () => {
        await addToService(entry.kind, entry.id);
        setId(null);
      });
    },
    [id, addToService],
  );
  return { id, add };
}
