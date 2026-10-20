import type { Metadata } from "next";
import { SongLibrary } from "@/features/songs/components/song-library";
import { loadSongSearchParams } from "@/lib/search-params";
import { requireSession } from "@/server/dal";

export const metadata: Metadata = { title: "Canciones" };

const PAGE_SIZE = 20;

export default async function SongsPage({ searchParams }: PageProps<"/songs">) {
  const { repos } = await requireSession();
  const [church, { search, page }] = await Promise.all([
    repos.church.get(),
    loadSongSearchParams(searchParams),
  ]);
  const songs = await repos.songs.list({
    search: search.trim() || undefined,
    page: Math.max(1, page),
    limit: PAGE_SIZE,
    sort: "title",
  });
  return <SongLibrary songs={songs} storage={church.storage} />;
}
