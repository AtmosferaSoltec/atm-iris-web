"use client";

import { Copyright, FileUp, Quote, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useRef, useState, useTransition } from "react";
import { SlidePreview } from "@/components/projection/slide-preview";
import { Banner } from "@/components/ui/banner";
import { Button, ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { Surface } from "@/components/ui/surface";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { toast } from "@/components/ui/toaster";
import type { Song } from "@/domain/models";
import { idleState, type FormState } from "@/lib/form-state";
import { formatLyrics, parseLyrics, titleFromFileName } from "@/lib/lyrics";
import { plural } from "@/lib/text";
import { deleteSong, saveSong } from "../actions";
import { IMPORT_LIMITS, type SongField } from "../schemas";

/** A screen with more lines than this is hard to read from the back of the room. */
const COMFORTABLE_LINES = 6;

/** `readOnly`: roles without `songs.manage` see the song and its preview, nothing to change. */
export function SongEditor({ song, readOnly = false }: { song?: Song; readOnly?: boolean }) {
  const router = useRouter();
  const [state, action] = useActionState(
    async (previous: FormState<SongField>, formData: FormData) => {
      const next = await saveSong(song?.id ?? null, previous, formData);
      if (next.status === "success") {
        toast.success("Canción guardada");
        router.push("/canciones");
      }
      return next;
    },
    idleState,
  );
  const [title, setTitle] = useState(song?.title ?? "");
  const [author, setAuthor] = useState(song?.author ?? "");
  const [copyright, setCopyright] = useState(song?.copyright ?? "");
  const [lyrics, setLyrics] = useState(song ? formatLyrics(song.sections) : "");
  const [fileError, setFileError] = useState<string>();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string>();
  const fileInput = useRef<HTMLInputElement>(null);

  const sections = parseLyrics(lyrics);
  // A field's error disappears as soon as its value changes from what was submitted.
  const errorFor = (field: SongField, value: string) =>
    value === state.values?.[field] ? state.fieldErrors?.[field] : undefined;

  async function loadFile(file: File | undefined) {
    if (!file) return;
    if (file.size > IMPORT_LIMITS.maxFileBytes) {
      setFileError("El archivo es demasiado grande (máximo 100 KB).");
      return;
    }
    setFileError(undefined);
    setLyrics(await file.text());
    if (!title.trim()) setTitle(titleFromFileName(file.name));
  }

  function confirmDelete() {
    if (!song) return;
    startDelete(async () => {
      const result = await deleteSong(song.id);
      if (result.error) {
        setDeleteError(result.error);
        setIsConfirmingDelete(false);
        return;
      }
      toast.success(`Se eliminó «${song.title}»`);
      router.push("/canciones");
    });
  }

  return (
    <form
      action={action}
      className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
      noValidate
    >
      <Surface className="flex flex-col gap-6 self-start p-6 sm:p-8">
        {(state.message || deleteError) && (
          <Banner tone="error">{state.message ?? deleteError}</Banner>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="title"
            label="Título"
            placeholder="Ej. Sublime gracia"
            icon={<Quote />}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            error={errorFor("title", title)}
            autoFocus={!song}
            readOnly={readOnly}
          />
          <TextField
            id="author"
            label="Autor"
            placeholder="Opcional"
            icon={<User />}
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            error={errorFor("author", author)}
            readOnly={readOnly}
          />
        </div>
        <TextField
          id="copyright"
          label="Derechos de autor"
          placeholder="Opcional"
          icon={<Copyright />}
          value={copyright}
          onChange={(event) => setCopyright(event.target.value)}
          error={errorFor("copyright", copyright)}
          hint={readOnly ? undefined : "Ej. Dominio público"}
          readOnly={readOnly}
        />
        <TextArea
          id="lyrics"
          label="Letra"
          placeholder={"[Estrofa 1]\nSublime gracia del Señor\nque a un pecador salvó\n\n[Coro]\n…"}
          value={lyrics}
          onChange={(event) => setLyrics(event.target.value)}
          error={errorFor("lyrics", lyrics) ?? fileError}
          readOnly={readOnly}
          hint={
            readOnly
              ? undefined
              : "Deja una línea en blanco entre diapositivas. Para nombrar una, escribe [Coro] o Estrofa 2 en su primera línea."
          }
          className="min-h-[420px] font-serif text-[17px]"
          spellCheck
          accessory={
            !readOnly && (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-ink"
              >
                <FileUp aria-hidden className="size-3.5" />
                Cargar desde .txt
              </button>
            )
          }
        />
        <input
          ref={fileInput}
          type="file"
          accept=".txt,text/plain"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => {
            void loadFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton size="lg">{song ? "Guardar cambios" : "Guardar canción"}</SubmitButton>
            <ButtonLink href="/canciones" variant="ghost" size="lg">
              Cancelar
            </ButtonLink>
          </div>
        )}
        {song && !readOnly && (
          <div className="border-t border-line pt-5">
            <Button
              variant="ghost"
              className="text-danger hover:text-danger"
              icon={<Trash2 className="size-4" />}
              onClick={() => setIsConfirmingDelete(true)}
            >
              Eliminar canción
            </Button>
          </div>
        )}
      </Surface>

      <section aria-label="Vista previa" className="flex flex-col gap-4">
        <SectionHeader
          accessory={
            <span className="text-xs text-ink-2 tabular-nums">
              {plural(sections.length, "diapositiva")}
            </span>
          }
        >
          Vista previa en el TV
        </SectionHeader>
        {sections.length === 0 ? (
          <Surface>
            <EmptyState
              icon={<Quote />}
              title="Aún no hay diapositivas"
              description="Escribe o pega la letra y aquí verás cómo se proyecta cada parte."
            />
          </Surface>
        ) : (
          <ol className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-4 gap-y-5">
            {sections.map((section, index) => {
              const lineCount = section.text.split("\n").length;
              return (
                <li key={index} className="flex flex-col gap-1.5">
                  <SlidePreview text={section.text} />
                  <div className="flex items-center justify-between gap-2 text-[13px]">
                    <span className="truncate font-medium text-ink-2">
                      {section.label ?? `Diapositiva ${index + 1}`}
                    </span>
                    {lineCount > COMFORTABLE_LINES && (
                      <Chip color="var(--color-warning)">{lineCount} líneas</Chip>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <ConfirmDialog
        open={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        onConfirm={confirmDelete}
        isPending={isDeleting}
        title={`¿Eliminar «${song?.title}»?`}
        description="Se quitará de la biblioteca. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
      />
    </form>
  );
}
