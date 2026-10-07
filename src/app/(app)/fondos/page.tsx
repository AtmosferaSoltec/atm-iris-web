import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackgroundLibrary } from "@/features/backgrounds/components/background-library";
import { requireSession } from "@/server/dal";

export const metadata: Metadata = { title: "Fondos" };

/** Download URLs are fetched one per asset, so a page never asks for more than this. */
const PAGE_SIZE = 24;

export default async function BackgroundsPage() {
  const { repos } = await requireSession();
  const church = await repos.church.get();
  if (!church.modules.multimedia) notFound();

  const backgrounds = await repos.media.list({ isBackground: true, limit: PAGE_SIZE });
  // Signed GETs expire in an hour: ask for them on every render, in parallel.
  const urls = Object.fromEntries(
    await Promise.all(
      backgrounds.data.map(async (asset) => [
        asset.id,
        await repos.media
          .downloadUrl(asset.id)
          .then((download) => download.url)
          .catch(() => null),
      ]),
    ),
  );

  return <BackgroundLibrary backgrounds={backgrounds} urls={urls} storage={church.storage} />;
}
