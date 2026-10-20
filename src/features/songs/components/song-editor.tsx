"use client";

import { Music, Quote, Search, Trash2, User } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { SlidePreview } from "@/components/projection/slide-preview";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
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
import { lyricsFromPlainText } from "@/lib/lyrics-import";
import type { YouTubeVideo } from "@/lib/youtube";
import { plural } from "@/lib/text";
import { deleteSong, saveSong } from "../actions";
import type { SongField } from "../schemas";
import { LyricsSearchDialog } from "./lyrics-search-dialog";
import { TrackField, type Track } from "./track-field";

/** A screen with more lines than this is hard to read from the back of the room. */
const COMFORTABLE_LINES = 6;

/**
 * A song's lyrics and track (contract §10), opened from the console's library. It says when
 * it saved or deleted the song; whoever opened it decides what follows.
 */
export function SongEditor({
  song,
  youtubeVideo,
  onSaved,
  onDeleted,
  onCancel,
}: {
  song?: Song;
  /** The song's YouTube track with its title. */
  youtubeVideo?: Omit<YouTubeVideo, "music">;
  onSaved: (id: string) => void;
  onDeleted: () => void;
  onCancel: () => void;
}) {
  const [state, action] = useActionState(
    async (previous: FormState<SongField>, formData: FormData) => {
      const next = await saveSong(song?.id ?? null, previous, formData);
      if (next.status === "success" && next.savedId) {
        toast.success("Canción guardada");
        onSaved(next.savedId);
      }
      return next;
    },
    idleState,
  );
  const [title, setTitle] = useState(song?.title ?? "");
  const [author, setAuthor] = useState(song?.author ?? "");
  const [lyrics, setLyrics] = useState(song ? formatLyrics(song.sections) : "");
  const [track, setTrack] = useState<Track | null>(() =>
    song?.audio
      ? { kind: "audio", audio: song.audio }
      : song?.youtubeId
        ? {
            kind: "youtube",
            video: {
              ...(youtubeVideo ?? {
                videoId: song.youtubeId,
                title: "Video de YouTube",
                author: "",
              }),
              music: song.youtubeMusic,
            },
          }
        : null,
  );
  const trackId =
    track?.kind === "audio" ? track.audio.id : track?.kind === "youtube" ? track.video.videoId : "";
  const [isSearchingLyrics, setIsSearchingLyrics] = useState(false);
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
      setIsConfirmingDelete(false);
      onDeleted();
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
        <TrackField
          track={track}
          onChange={setTrack}
          error={
            errorFor("audioId", track?.kind === "audio" ? trackId : "") ??
            errorFor("youtubeId", track?.kind === "youtube" ? trackId : "")
          }
        />
        <TextArea
          id="lyrics"
          label="Letra"
          placeholder={"#Estrofa 1\nSublime gracia del Señor\nque a un pecador salvó\n\n#Coro\n…"}
          value={lyrics}
          onChange={(event) => setLyrics(event.target.value)}
          error={errorFor("lyrics", lyrics)}
          accessory={
            <Button
              variant="ghost"
              size="sm"
              icon={<Search className="size-4" />}
              onClick={() => setIsSearchingLyrics(true)}
            >
              Buscar letra
            </Button>
          }
          hint="Deja una línea en blanco entre diapositivas. Para nombrar una, escribe # y el nombre en su primera línea (por ejemplo #Coro). Si la canción tiene pista, la letra es opcional."
          className="min-h-[420px] font-serif text-[17px]"
          spellCheck
        />
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton size="lg">{song ? "Guardar cambios" : "Guardar canción"}</SubmitButton>
          <Button variant="ghost" size="lg" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
        {song && (
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
            {track ? (
              <EmptyState
                icon={<Music />}
                title="Solo pista"
                description="Sin letra, en la consola solo suena la pista y la pantalla se queda como está. Puedes agregar la letra cuando quieras."
              />
            ) : (
              <EmptyState
                icon={<Quote />}
                title="Aún no hay diapositivas"
                description="Escribe o pega la letra y aquí verás cómo se proyecta cada parte."
              />
            )}
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

      {isSearchingLyrics && (
        <LyricsSearchDialog
          initialTitle={title}
          initialArtist={author}
          replacesLyrics={lyrics.trim() !== ""}
          onClose={() => setIsSearchingLyrics(false)}
          onPick={(found) => {
            setLyrics(lyricsFromPlainText(found.lyrics));
            if (!title.trim()) setTitle(found.title);
            if (!author.trim()) setAuthor(found.artist);
            setIsSearchingLyrics(false);
            toast.success("Letra cargada. Revísala antes de guardar.");
          }}
        />
      )}

      <ConfirmDialog
        open={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        onConfirm={confirmDelete}
        isPending={isDeleting}
        title={`¿Eliminar «${song?.title}»?`}
        description={
          song?.audio
            ? "Se quitará de la biblioteca junto con su pista. Esta acción no se puede deshacer."
            : "Se quitará de la biblioteca. Esta acción no se puede deshacer."
        }
        confirmLabel="Eliminar"
      />
    </form>
  );
}
