"use client";

import { Download, Upload } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { plural } from "@/lib/text";
import { exportBackup, importBackup } from "../actions";

/** Save the songs and YouTube links as a file, and bring them into this or another account. */
export function BackupPanel() {
  const picker = useRef<HTMLInputElement>(null);
  const [isExporting, startExport] = useTransition();
  const [isImporting, startImport] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function download() {
    setError(null);
    startExport(async () => {
      const result = await exportBackup();
      if (!result.json) {
        setError(result.error ?? "No pudimos preparar el respaldo.");
        return;
      }
      const url = URL.createObjectURL(new Blob([result.json], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `iris-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  function upload(file: File) {
    setError(null);
    startImport(async () => {
      const result = await importBackup(await file.text());
      if (!result.result) {
        setError(result.error ?? "No pudimos importar el respaldo.");
        return;
      }
      const { songs, youtubeVideos, skipped, withoutLyrics } = result.result;
      toast.success(
        `Se importaron ${plural(songs, "canción", "canciones")} y ${plural(youtubeVideos, "video de YouTube", "videos de YouTube")}` +
          (skipped ? `; ${skipped} ya estaban` : "") +
          (withoutLyrics ? `; ${withoutLyrics} eran solo pista y no se traen` : ""),
      );
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Banner tone="error">{error}</Banner>}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          icon={<Download className="size-4" />}
          onClick={download}
          isLoading={isExporting}
        >
          Descargar respaldo
        </Button>
        <Button
          variant="secondary"
          icon={<Upload className="size-4" />}
          onClick={() => picker.current?.click()}
          isLoading={isImporting}
        >
          Importar respaldo
        </Button>
        <input
          ref={picker}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload(file);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
