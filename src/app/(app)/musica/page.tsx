import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MusicLibrary } from "@/features/music/components/music-library";
import { loadMediaSearchParams } from "@/lib/search-params";
import { requireSession } from "@/server/dal";

export const metadata: Metadata = { title: "Música" };

/** A list, not a grid: download URLs are asked for only when a track is played. */
const PAGE_SIZE = 50;

export default async function MusicPage({ searchParams }: PageProps<"/musica">) {
  const { repos } = await requireSession();
  const [church, { search, page }] = await Promise.all([
    repos.church.get(),
    loadMediaSearchParams(searchParams),
  ]);
  if (!church.modules.multimedia) notFound();

  const tracks = await repos.media.list({
    kind: "audio",
    search: search.trim() || undefined,
    page: Math.max(1, page),
    limit: PAGE_SIZE,
  });

  return <MusicLibrary tracks={tracks} storage={church.storage} />;
}
