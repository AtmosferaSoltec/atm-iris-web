"use client";

import { FileText, Upload, X } from "lucide-react";
import { useState, useTransition, type DragEvent } from "react";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { parseLyrics, titleFromFileName } from "@/lib/lyrics";
import { nameKey, plural } from "@/lib/text";
import { importSongs } from "../actions";
import { IMPORT_LIMITS } from "../schemas";

type Candidate = {
  key: string;
  fileName: string;
  title: string;
  lyrics: string;
  sectionCount: number;
  problem?: string;
};

type Props = { open: boolean; onClose: () => void; existingTitles: string[] };

export function ImportSongsDialog({ open, onClose, existingTitles }: Props) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const ready = candidates.filter((candidate) => !candidate.problem);

  function close() {
    setCandidates([]);
    setError(undefined);
    setResult(undefined);
    onClose();
  }

  async function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    setResult(undefined);
    const taken = new Set([...existingTitles, ...candidates.map((c) => c.title)].map(nameKey));
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
      const problem =
        sectionCount === 0
          ? "Sin letra"
          : taken.has(nameKey(title))
            ? "Ya está en tu biblioteca"
            : undefined;
      taken.add(nameKey(title));
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
        ready.map(({ title, lyrics }) => ({ title, author: "", lyrics })),
      );
      if (response.error) {
        setError(response.error);
        return;
      }
      setCandidates([]);
      setResult(
        `Se ${response.created === 1 ? "importó 1 canción" : `importaron ${response.created} canciones`}.`,
      );
    });
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      size="lg"
      title="Importar canciones"
      description="Sube uno o varios archivos .txt. El nombre del archivo será el título y cada línea en blanco separa una diapositiva."
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            {result ? "Listo" : "Cancelar"}
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
        {result && <Banner tone="success">{result}</Banner>}
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
          <span className="text-sm text-ink-3">
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

        {candidates.length > 0 && (
          <ul className="divide-y divide-line overflow-hidden rounded-md ring-1 ring-line">
            {candidates.map((candidate) => (
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
                  <p className="truncate text-xs text-ink-3">{candidate.fileName}</p>
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
