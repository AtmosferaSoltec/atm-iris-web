"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type { MediaAsset } from "@/domain/models";
import { MediaDetailDialog } from "@/features/media/components/media-detail-dialog";
import { mediaFile } from "./actions";

/** "Ver y editar" a file: its preview, title and description, and deleting it. */
export function MediaDialog({
  mediaId,
  onClose,
  onSaved,
  onDeleted,
}: {
  mediaId: string;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [file, setFile] = useState<{ asset: MediaAsset; url: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void mediaFile(mediaId).then((result) => {
      if (cancelled) return;
      if (result.asset) setFile({ asset: result.asset, url: result.url ?? null });
      else onClose();
    });
    return () => {
      cancelled = true;
    };
  }, [mediaId, onClose]);

  if (!file) {
    return (
      <Dialog open onClose={onClose} ariaLabel="Abriendo el archivo">
        <p className="flex items-center gap-2 py-10 text-sm text-ink-2">
          <Spinner className="size-4" /> Abriendo…
        </p>
      </Dialog>
    );
  }
  return (
    <MediaDetailDialog
      asset={file.asset}
      url={file.url}
      onClose={onClose}
      onSaved={onSaved}
      onDeleted={onDeleted}
    />
  );
}
