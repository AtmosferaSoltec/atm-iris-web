import type { Metadata } from "next";
import { SongLibrary } from "@/features/songs/components/song-library";
import { requireSession } from "@/server/dal";

export const metadata: Metadata = { title: "Canciones" };

export default async function SongsPage() {
  const { repos } = await requireSession();
  const songs = await repos.songs.list();
  return <SongLibrary songs={songs} />;
}
