import type { Metadata } from "next";
import { SongLibrary } from "@/features/songs/components/song-library";
import { can } from "@/lib/permissions";
import { loadSongSearchParams } from "@/lib/search-params";
import { requireSession } from "@/server/dal";

export const metadata: Metadata = { title: "Canciones" };

const PAGE_SIZE = 20;

export default async function SongsPage({ searchParams }: PageProps<"/canciones">) {
  const { session, repos } = await requireSession();
  const { search, page, sort } = await loadSongSearchParams(searchParams);
  const songs = await repos.songs.list({
    search: search.trim() || undefined,
    page: Math.max(1, page),
    limit: PAGE_SIZE,
    sort,
  });
  return <SongLibrary songs={songs} canManage={can(session, "songs.manage")} />;
}
