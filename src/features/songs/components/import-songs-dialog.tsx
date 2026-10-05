"use client";

import { FileText, Upload, X } from "lucide-react";
import { useEffect, useState, useTransition, type DragEvent } from "react";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/cn";
import { parseLyrics, titleFromFileName } from "@/lib/lyrics";
import { nameKey, plural } from "@/lib/text";
import { importSongs, listSongTitles } from "../actions";
import { IMPORT_LIMITS } from "../schemas";

type Candidate = {
  key: string;
  fileName: string;
  title: string;
  lyrics: string;
  sectionCount: number;
  problem?: string;
};

type Outcome = { created: number; skipped: string[] };

/** Mounted while open. Warns about duplicates first; the server has the last word. */
export function ImportSongsDialog({ onClose }: { onClose: () => void }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [existingTitles, setExistingTitles] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>();
  const [outcome, setOutcome] = useState<Outcome>();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Only a heads-up: if it fails, the import still skips duplicates on the server.
    listSongTitles().then(setExistingTitles, () => undefined);
  }, []);

  // Duplicates are worked out on every render, so they show up even when the
  // library's titles arrive after the files were dropped.
  const library = new Set(existingTitles.map(nameKey));
  const seen = new Set<string>();
  const checked = candidates.map((candidate) => {
    const key = nameKey(candidate.title);
    const problem =
      candidate.problem ??
      (library.has(key)
        ? "Ya está en tu biblioteca"
        : seen.has(key)
          ? "Repetida en esta importación"
          : undefined);
    if (!candidate.problem) seen.add(key);
    return { ...candidate, problem };
  });
  const ready = checked.filter((candidate) => !candidate.problem);
  const close = onClose;

  async function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    setOutcome(undefined);
    const next: Candidate[] = [];

    for (const file of Array.from(fileList)) {
      const title = titleFromFileName(file.name);
      const base = {
        key: `${file.name}-${file.lastModified}-${file.size}`,
        fileName: file.name,
        title,
      };
      if (!/\.txt$/i.test(file.name) && file.type !== "text/plain") {
        next.push({ ...base, lyrics: "", sectionCount: 0, problem: "No es un archivo .txt" });
        continue;
      }
      if (file.size > IMPORT_LIMITS.maxFileBytes) {
        next.push({ ...base, lyrics: "", sectionCount: 0, problem: "Archivo muy grande" });
        continue;
      }
      const lyrics = await file.text();
      const sectionCount = parseLyrics(lyrics).length;
      const problem = sectionCount === 0 ? "Sin letra" : undefined;
      next.push({ ...base, lyrics, sectionCount, problem });
    }

    setCandidates((current) => [...current, ...next].slice(0, IMPORT_LIMITS.maxFiles));
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setIsDragging(false);
    void addFiles(event.dataTransfer.files);
  }

  function submit() {
    setError(undefined);
    startTransition(async () => {
      const response = await importSongs(
        ready.map(({ title, lyrics }) => ({ title, author: "", copyright: "", lyrics })),
      );
      if (!response.result) {
        setError(response.error);
        return;
      }
      const created = response.result.created.length;
      setCandidates([]);
      setExistingTitles((titles) => [...titles, ...response.result!.created.map((s) => s.title)]);
      setOutcome({ created, skipped: response.result.skipped.map((item) => item.title) });
      if (created > 0) toast.success(importedMessage(created));
    });
  }

  return (
    <Dialog
      open
      onClose={close}
      size="lg"
      title="Importar canciones"
      description="Sube uno o varios archivos .txt. El nombre del archivo será el título y cada línea en blanco separa una diapositiva."
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            {outcome ? "Listo" : "Cancelar"}
          </Button>
          <Button onClick={submit} isLoading={isPending} disabled={ready.length === 0}>
            {ready.length > 0
              ? `Importar ${plural(ready.length, "canción", "canciones")}`
              : "Importar"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <Banner tone="error">{error}</Banner>}
        {outcome && (
          <Banner tone={outcome.created > 0 ? "success" : "info"}>
            <p>{importedMessage(outcome.created)}</p>
            {outcome.skipped.length > 0 && (
              <p className="mt-1 text-ink-2">
                Ya estaban en tu biblioteca: {outcome.skipped.join(", ")}.
              </p>
            )}
          </Banner>
        )}
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-line-strong bg-surface px-6 py-10 text-center transition",
            isDragging ? "border-coral bg-coral/8" : "hover:bg-surface-raised",
          )}
        >
          <Upload aria-hidden className="size-7 text-coral" />
          <span className="font-semibold">Arrastra tus archivos aquí</span>
          <span className="text-sm text-ink-2">
            o haz clic para elegirlos · hasta {IMPORT_LIMITS.maxFiles} archivos de 100 KB
          </span>
          <input
            type="file"
            accept=".txt,text/plain"
            multiple
            className="sr-only"
            onChange={(event) => {
              void addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>

        {checked.length > 0 && (
          <ul className="divide-y divide-line overflow-hidden rounded-md ring-1 ring-line">
            {checked.map((candidate) => (
              <li key={candidate.key} className="flex items-center gap-3 px-4 py-3">
                <FileText
                  aria-hidden
                  className={cn("size-4 shrink-0", candidate.problem ? "text-ink-3" : "text-ember")}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm font-semibold",
                      candidate.problem && "text-ink-3",
                    )}
                  >
                    {candidate.title}
                  </p>
                  <p className="truncate text-xs text-ink-2">{candidate.fileName}</p>
                </div>
                {candidate.problem ? (
                  <Chip color="var(--color-warning)">{candidate.problem}</Chip>
                ) : (
                  <Chip color="var(--color-success)">
                    {plural(candidate.sectionCount, "diapositiva")}
                  </Chip>
                )}
                <button
                  type="button"
                  aria-label={`Quitar ${candidate.title}`}
                  onClick={() =>
                    setCandidates((current) => current.filter((c) => c.key !== candidate.key))
                  }
                  className="grid size-8 cursor-pointer place-items-center rounded-full text-ink-3 hover:bg-surface hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}

function importedMessage(created: number): string {
  if (created === 0) return "No se importó ninguna canción.";
  return created === 1 ? "Se importó 1 canción." : `Se importaron ${created} canciones.`;
}
