"use client";

import { Link2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import { youTubeVideo } from "../actions";
import { youTubeThumbnail, youTubeVideoId } from "@/lib/youtube";

/**
 * "Agregar video de YouTube": paste a link, see what it is, add it to this service. It plays in
 * YouTube's own player on the screens (with sound from the console); nothing is downloaded.
 */
export function YouTubeDialog({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (video: { videoId: string; title: string; author: string }) => void;
}) {
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, startLoad] = useTransition();
  const videoId = youTubeVideoId(link);

  function add() {
    setError(null);
    startLoad(async () => {
      const result = await youTubeVideo(link);
      if (result.video) onAdd(result.video);
      else setError(result.error ?? "No pudimos agregar el video.");
    });
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Video de YouTube"
      description="Pega el enlace. Se reproduce en la pantalla con el reproductor de YouTube y el sonido sale de esta computadora. Necesita internet."
      size="md"
    >
      <form
        className="flex flex-col gap-4 pb-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (videoId) add();
        }}
      >
        {error && <Banner tone="error">{error}</Banner>}
        <TextField
          id="youtube-link"
          label="Enlace"
          placeholder="https://www.youtube.com/watch?v=…"
          icon={<Link2 />}
          value={link}
          onChange={(event) => {
            setLink(event.target.value);
            setError(null);
          }}
          error={link.trim() && !videoId ? "Ese enlace no es de un video de YouTube." : undefined}
          autoFocus
        />
        {videoId && (
          // eslint-disable-next-line @next/next/no-img-element -- YouTube's thumbnail
          <img
            src={youTubeThumbnail(videoId)}
            alt=""
            className="aspect-video w-full rounded-md object-cover ring-1 ring-line"
          />
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!videoId} isLoading={isLoading}>
            Agregar al servicio
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
