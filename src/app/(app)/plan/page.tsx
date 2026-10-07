import type { Metadata } from "next";
import { PlanBoard, type PlanRow } from "@/features/service-plan/components/plan-board";
import { requireSession } from "@/server/dal";

export const metadata: Metadata = { title: "Plan" };

export default async function PlanPage() {
  const { repos } = await requireSession();
  const [church, items] = await Promise.all([repos.church.get(), repos.servicePlan.list()]);

  const rows: PlanRow[] = await Promise.all(
    items.map(async (item): Promise<PlanRow> => {
      if (item.kind === "song") {
        const song = await repos.songs.get(item.refId);
        return {
          item,
          title: song?.title ?? "",
          subtitle: song?.author || null,
          mediaKind: null,
          thumbnailUrl: null,
        };
      }
      const asset = await repos.media.get(item.refId);
      const url =
        asset?.kind === "image"
          ? await repos.media
              .downloadUrl(asset.id)
              .then((download) => download.url)
              .catch(() => null)
          : null;
      return {
        item,
        title: asset?.title ?? "",
        subtitle: null,
        mediaKind: asset?.kind ?? null,
        thumbnailUrl: url,
      };
    }),
  );

  return <PlanBoard rows={rows} canAddMedia={church.modules.multimedia} />;
}
