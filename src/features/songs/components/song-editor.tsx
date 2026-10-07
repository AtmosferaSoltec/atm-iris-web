"use client";

import { Quote, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
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
import { formatLyrics, parseLyrics } from "@/lib/lyrics";
import { plural } from "@/lib/text";
import { deleteSong, saveSong } from "../actions";
import type { SongField } from "../schemas";

/** A screen with more lines than this is hard to read from the back of the room. */
const COMFORTABLE_LINES = 6;

export function SongEditor({ song }: { song?: Song }) {
  const router = useRouter();
  const [state, action] = useActionState(
    async (previous: FormState<SongField>, formData: FormData) => {
      const next = await saveSong(song?.id ?? null, previous, formData);
      if (next.status === "success") {
        toast.success("Letra guardada");
        router.push("/letras");
      }
      return next;
    },
    idleState,
  );
  const [title, setTitle] = useState(song?.title ?? "");
  const [author, setAuthor] = useState(song?.author ?? "");
  const [lyrics, setLyrics] = useState(song ? formatLyrics(song.sections) : "");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string>();

  const sections = parseLyrics(lyrics);
  // A field's error disappears as soon as its value changes from what was submitted.
  const errorFor = (field: SongField, value: string) =>
    value === state.values?.[field] ? state.fieldErrors?.[field] : undefined;

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
      router.push("/letras");
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
          />
          <TextField
            id="author"
            label="Autor"
            placeholder="Opcional"
            icon={<User />}
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            error={errorFor("author", author)}
          />
        </div>
        <TextArea
          id="lyrics"
          label="Letra"
          placeholder={"#Estrofa 1\nSublime gracia del Señor\nque a un pecador salvó\n\n#Coro\n…"}
          value={lyrics}
          onChange={(event) => setLyrics(event.target.value)}
          error={errorFor("lyrics", lyrics)}
          hint="Deja una línea en blanco entre diapositivas. Para nombrar una, escribe # y el nombre en su primera línea (por ejemplo #Coro). Es opcional."
          className="min-h-[420px] font-serif text-[17px]"
          spellCheck
        />
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton size="lg">{song ? "Guardar cambios" : "Guardar letra"}</SubmitButton>
          <ButtonLink href="/letras" variant="ghost" size="lg">
            Cancelar
          </ButtonLink>
        </div>
        {song && (
          <div className="border-t border-line pt-5">
            <Button
              variant="ghost"
              className="text-danger hover:text-danger"
              icon={<Trash2 className="size-4" />}
              onClick={() => setIsConfirmingDelete(true)}
            >
              Eliminar letra
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
