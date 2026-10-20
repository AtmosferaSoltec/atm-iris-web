"use client";

import { useCallback, useState } from "react";
import { toast } from "@/components/ui/toaster";
import type { MediaAsset } from "@/domain/models";
import type { LibraryEntry } from "../model";
import type { LiveConsole } from "../use-live-console";
import { libraryItem } from "./actions";
import { mediaEntry, sortEntries } from "./entries";

/**
 * BIBLIOTECA's own state: the songs and files, kept current here after a song is saved, a
 * file uploaded or something deleted, without reloading the console. What is in the service
 * follows through `ctrl` (the only thing it touches there).
 */
export function useLibrary(
  initial: LibraryEntry[],
  ctrl: Pick<LiveConsole, "updateRef" | "dropRef">,
) {
  const [entries, setEntries] = useState(initial);
  const { updateRef, dropRef } = ctrl;

  const upsert = useCallback(
    (entry: LibraryEntry) =>
      setEntries((current) =>
        sortEntries([...current.filter((candidate) => candidate.id !== entry.id), entry]),
      ),
    [],
  );

  const forget = useCallback(
    (id: string) => {
      setEntries((current) => current.filter((candidate) => candidate.id !== id));
      dropRef(id);
    },
    [dropRef],
  );

  /** After saving or editing: the latest version, in the list and in the service. */
  const refresh = useCallback(
    async (kind: "song" | "media", id: string) => {
      const result = await libraryItem(kind, id);
      if (result.gone) forget(id);
      else if (result.entry) {
        upsert(result.entry);
        if (result.content) updateRef(id, result.content);
      } else if (result.error) toast.error(result.error);
    },
    [forget, upsert, updateRef],
  );

  const savedYouTube = useCallback(
    (entry: LibraryEntry) => {
      upsert(entry);
      toast.success(`Se guardó «${entry.title}»`);
    },
    [upsert],
  );

  const uploaded = useCallback(
    (asset: MediaAsset) => {
      upsert(mediaEntry(asset));
      toast.success(`Se subió «${asset.title}»`);
      void refresh("media", asset.id); // brings its preview
    },
    [upsert, refresh],
  );

  return { entries, refresh, forget, uploaded, savedYouTube };
}

export type Library = ReturnType<typeof useLibrary>;
