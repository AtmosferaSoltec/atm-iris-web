import type { Metadata } from "next";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { SongEditor } from "@/features/songs/components/song-editor";
import { requireSession } from "@/server/dal";

export const metadata: Metadata = { title: "Nueva canción" };

export default async function NewSongPage() {
  await requireSession();
  return (
    <div className="mx-auto flex max-w-content flex-col gap-8">
      <BackLink href="/songs">Canciones</BackLink>
      <PageHeader
        title="Nueva canción"
        description="Escribe la letra y pega el enlace de su pista en YouTube o YouTube Music. Al elegirla en la consola, ya están juntas."
      />
      <SongEditor />
    </div>
  );
}
