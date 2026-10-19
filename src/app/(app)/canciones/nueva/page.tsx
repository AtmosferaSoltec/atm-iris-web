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
      <BackLink href="/canciones">Canciones</BackLink>
      <PageHeader
        title="Nueva canción"
        description="Pega la letra, sube la pista o las dos. Al elegirla en la consola, ya están juntas."
      />
      <SongEditor />
    </div>
  );
}
