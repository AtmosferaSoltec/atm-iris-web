"use client";

import { CirclePlay, Plus, Upload } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import type { MediaKind } from "@/domain/models";
import { acceptedTypes } from "@/features/media/media-format";

/** What the library's second row can make: a song, files of one kind, or a YouTube link. */
export type ToolbarTab = "song" | "image" | "video" | "youtube";

const UPLOAD_LABELS: Record<"image" | "video", string> = {
  image: "Subir imágenes",
  video: "Subir videos",
};

/** What can be made from the library: songs, images, videos or YouTube links. */
export function LibraryToolbar({
  tab,
  onNewSong,
  onUpload,
  onYouTube,
}: {
  tab: ToolbarTab;
  onNewSong: () => void;
  onUpload: (files: FileList) => void;
  onYouTube: () => void;
}) {
  const filePicker = useRef<HTMLInputElement>(null);

  if (tab === "song") {
    return (
      <Button size="sm" icon={<Plus className="size-4" />} onClick={onNewSong}>
        Nueva canción
      </Button>
    );
  }

  if (tab === "youtube") {
    return (
      <Button size="sm" icon={<CirclePlay className="size-4" />} onClick={onYouTube}>
        Agregar enlace de YouTube
      </Button>
    );
  }

  const kind: MediaKind = tab;
  return (
    <>
      <Button
        size="sm"
        icon={<Upload className="size-4" />}
        onClick={() => filePicker.current?.click()}
      >
        {UPLOAD_LABELS[tab]}
      </Button>
      <input
        ref={filePicker}
        type="file"
        multiple
        accept={acceptedTypes([kind])}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          if (event.target.files) onUpload(event.target.files);
          event.target.value = "";
        }}
      />
    </>
  );
}
