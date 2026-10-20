"use client";

import { useEffect, useState } from "react";
import { Banner } from "@/components/ui/banner";
import { Dialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type { Song } from "@/domain/models";
import type { ProjectionBackground } from "@/features/projection/model";
import type { YouTubeVideo } from "@/lib/youtube";
import { SongEditor } from "@/features/songs/components/song-editor";
import { songForEditing } from "./actions";

type Loaded = { song: Song; youtube?: Omit<YouTubeVideo, "music"> };

/**
 * "Nueva canción" or "Editar canción", over the console: the whole editor (lyrics, track,
 * "Buscar letra") in a large dialog. An existing song is read fresh when it opens.
 */
export function SongDialog({
  songId,
  backgrounds,
  onClose,
  onSaved,
  onDeleted,
}: {
  /** Null for a new song. */
  songId: string | null;
  backgrounds: ProjectionBackground[];
  onClose: () => void;
  onSaved: (id: string) => void;
  onDeleted: (id: string) => void;
}) {
  const [loaded, setLoaded] = useState<Loaded | { error: string } | null>(null);

  useEffect(() => {
    if (!songId) return;
    let cancelled = false;
    void songForEditing(songId).then((result) => {
      if (cancelled) return;
      setLoaded(
        result.song
          ? { song: result.song, youtube: result.youtube }
          : { error: result.error ?? "No pudimos abrir la canción." },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [songId]);

  const title = songId
    ? loaded && "song" in loaded
      ? loaded.song.title
      : "Editar canción"
    : "Nueva canción";

  return (
    <Dialog
      open
      onClose={onClose}
      size="xl"
      title={title}
      description="Escribe o busca la letra y pega el enlace de su pista en YouTube o YouTube Music."
    >
      <div className="pb-6">
        {!songId ? (
          <SongEditor
            backgrounds={backgrounds}
            onSaved={onSaved}
            onDeleted={onClose}
            onCancel={onClose}
          />
        ) : !loaded ? (
          <p className="flex items-center gap-2 py-16 text-sm text-ink-2">
            <Spinner className="size-4" /> Abriendo la canción…
          </p>
        ) : "error" in loaded ? (
          <Banner tone="error">{loaded.error}</Banner>
        ) : (
          <SongEditor
            song={loaded.song}
            youtubeVideo={loaded.youtube}
            backgrounds={backgrounds}
            onSaved={onSaved}
            onDeleted={() => onDeleted(loaded.song.id)}
            onCancel={onClose}
          />
        )}
      </div>
    </Dialog>
  );
}
