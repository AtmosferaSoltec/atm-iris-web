"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { deleteMedia } from "@/features/media/actions";
import { deleteSong } from "@/features/songs/actions";
import { deleteYouTubeVideo } from "../actions";
import type { ProjectionBackground } from "@/features/projection/model";
import type { LibraryEntry } from "../model";
import { MediaDialog } from "./media-dialog";
import { SongDialog } from "./song-dialog";
import type { Library } from "./use-library";
import { YouTubeDialog } from "./youtube-dialog";

/** Which of the library's dialogs is open, if any. */
export type LibraryDialog =
  | { kind: "song"; id: string | null }
  | { kind: "media"; id: string }
  | { kind: "youtube" }
  | { kind: "delete"; entry: LibraryEntry };

/** The library's dialogs, one at a time. Each saves on its own and tells the library. */
export function LibraryDialogs({
  dialog,
  onClose,
  library,
  backgrounds,
}: {
  dialog: LibraryDialog | null;
  onClose: () => void;
  library: Library;
  backgrounds: ProjectionBackground[];
}) {
  if (!dialog) return null;
  switch (dialog.kind) {
    case "song":
      return (
        <SongDialog
          songId={dialog.id}
          backgrounds={backgrounds}
          onClose={onClose}
          onSaved={(id) => {
            onClose();
            void library.refresh("song", id);
          }}
          onDeleted={(id) => {
            onClose();
            library.forget(id);
          }}
        />
      );
    case "media":
      return (
        <MediaDialog
          mediaId={dialog.id}
          onClose={onClose}
          onSaved={() => void library.refresh("media", dialog.id)}
          onDeleted={() => library.forget(dialog.id)}
        />
      );
    case "youtube":
      return (
        <YouTubeDialog
          onClose={onClose}
          onSaved={(entry) => {
            library.savedYouTube(entry);
            onClose();
          }}
        />
      );
    case "delete":
      return <DeleteDialog entry={dialog.entry} onClose={onClose} library={library} />;
  }
}

function DeleteDialog({
  entry,
  onClose,
  library,
}: {
  entry: LibraryEntry;
  onClose: () => void;
  library: Library;
}) {
  const [isDeleting, startDelete] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <ConfirmDialog
      open
      onClose={onClose}
      isPending={isDeleting}
      title={`¿Eliminar «${entry.title}»?`}
      description={
        entry.kind === "song"
          ? "Se quita de la biblioteca y del servicio, con su pista si la subiste. No se puede deshacer."
          : entry.kind === "youtube"
            ? "Se quita de la biblioteca y del servicio. El video sigue en YouTube."
            : "Se borra el archivo y se quita del servicio. No se puede deshacer."
      }
      error={error}
      confirmLabel="Eliminar"
      onConfirm={() =>
        startDelete(async () => {
          const result =
            entry.kind === "song"
              ? await deleteSong(entry.id)
              : entry.kind === "youtube"
                ? await deleteYouTubeVideo(entry.id)
                : await deleteMedia(entry.id);
          if (result.error) {
            setError(result.error);
            return;
          }
          library.forget(entry.id);
          toast.success(`Se eliminó «${entry.title}»`);
          onClose();
        })
      }
    />
  );
}
