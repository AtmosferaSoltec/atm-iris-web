import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { SongEditor } from "@/features/songs/components/song-editor";
import { requireSession } from "@/server/dal";

export const metadata: Metadata = { title: "Editar canción" };

export default async function EditSongPage({ params }: PageProps<"/canciones/[id]">) {
  const { id } = await params;
  const { repos } = await requireSession();
  const song = await repos.songs.get(id);
  if (!song) notFound();

  return (
    <div className="mx-auto flex max-w-content flex-col gap-8">
      <BackLink href="/canciones">Canciones</BackLink>
      <PageHeader title={song.title} description={song.author || "Sin autor"} />
      <SongEditor song={song} />
    </div>
  );
}
