import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Banner } from "@/components/ui/banner";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { SongEditor } from "@/features/songs/components/song-editor";
import { requireSession } from "@/server/dal";
import { lookUpYouTube } from "@/server/youtube";

export async function generateMetadata({ params }: PageProps<"/songs/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { repos } = await requireSession();
  const song = await repos.songs.get(id);
  return { title: song?.title ?? "Canción" };
}

export default async function EditSongPage({ params }: PageProps<"/songs/[id]">) {
  const { id } = await params;
  const { repos } = await requireSession();
  const song = await repos.songs.get(id);
  if (!song) notFound();
  const youtube = song.youtubeId ? await lookUpYouTube(song.youtubeId) : null;

  return (
    <div className="mx-auto flex max-w-content flex-col gap-8">
      <BackLink href="/songs">Canciones</BackLink>
      <PageHeader title={song.title} description={song.author || "Sin autor"} />
      {youtube?.error && <Banner tone="error">{`Pista de YouTube: ${youtube.error}`}</Banner>}
      <SongEditor song={song} youtubeVideo={youtube?.video} />
    </div>
  );
}
