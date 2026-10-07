import type { Metadata } from "next";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { SongEditor } from "@/features/songs/components/song-editor";
import { requireSession } from "@/server/dal";

export const metadata: Metadata = { title: "Nueva letra" };

export default async function NewSongPage() {
  await requireSession();
  return (
    <div className="mx-auto flex max-w-content flex-col gap-8">
      <BackLink href="/letras">Letras</BackLink>
      <PageHeader
        title="Nueva letra"
        description="Pega la letra y revisa cómo se verá cada diapositiva antes de guardarla."
      />
      <SongEditor />
    </div>
  );
}
