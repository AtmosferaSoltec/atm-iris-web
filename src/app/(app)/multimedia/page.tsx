import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MediaLibrary } from "@/features/media/components/media-library";
import { loadMediaSearchParams } from "@/lib/search-params";
import { requireSession } from "@/server/dal";

export const metadata: Metadata = { title: "Multimedia" };

/** Download URLs are fetched one per asset, so a page never asks for more than this. */
const PAGE_SIZE = 20;

export default async function MediaPage({ searchParams }: PageProps<"/multimedia">) {
  const { repos } = await requireSession();
  const [church, { kind, search, page }] = await Promise.all([
    repos.church.get(),
    loadMediaSearchParams(searchParams),
  ]);
  if (!church.modules.multimedia) notFound();

  const media = await repos.media.list({
    kind,
    search: search.trim() || undefined,
    page: Math.max(1, page),
    limit: PAGE_SIZE,
  });
  // Signed GETs expire in an hour: ask for them on every render, in parallel.
  const urls = Object.fromEntries(
    await Promise.all(
      media.data.map(async (asset) => [
        asset.id,
        await repos.media
          .downloadUrl(asset.id)
          .then((download) => download.url)
          .catch(() => null),
      ]),
    ),
  );

  return <MediaLibrary media={media} urls={urls} storage={church.storage} />;
}
