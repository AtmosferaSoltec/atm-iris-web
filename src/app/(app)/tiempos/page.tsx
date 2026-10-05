import { Timer } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Surface } from "@/components/ui/surface";
import type { ServiceRecord } from "@/domain/models";
import { blockNames, dateRange } from "@/domain/time-statistics";
import { TimesView } from "@/features/times/components/times-view";
import { periodFromParams } from "@/features/times/period";
import { can } from "@/lib/permissions";
import { loadTimeSearchParams } from "@/lib/search-params";
import { zonedParts } from "@/lib/zoned-time";
import { requireSession } from "@/server/dal";
import type { RecordListQuery, Repositories } from "@/server/repositories/types";

export const metadata: Metadata = { title: "Tiempos" };

/** Contract §14 allows 500 per page: walk the pages until the range is complete. */
async function loadAllRecords(
  repos: Repositories,
  query: RecordListQuery,
): Promise<ServiceRecord[]> {
  const records: ServiceRecord[] = [];
  for (let page = 1; ; page += 1) {
    const { data, meta } = await repos.records.list({ ...query, page, limit: 500 });
    records.push(...data);
    if (page >= meta.totalPages) return records;
  }
}

export default async function TimesPage({ searchParams }: PageProps<"/tiempos">) {
  const { session, repos } = await requireSession();
  const [church, params, types, people, newest] = await Promise.all([
    repos.church.get(),
    loadTimeSearchParams(searchParams),
    repos.serviceTypes.list(),
    repos.people.list(),
    repos.records.list({ limit: 1 }),
  ]);
  if (!church.modules.timeControl) notFound();

  if (newest.meta.total === 0) {
    return (
      <div className="mx-auto flex max-w-content flex-col gap-8">
        <PageHeader title="Tiempos" />
        <Surface>
          <EmptyState
            icon={<Timer />}
            title="Aún no hay tiempos"
            description="Se guardan al terminar un servicio con bloques."
          />
        </Surface>
      </div>
    );
  }

  const now = new Date();
  const timeZone = church.timezone;
  const period = periodFromParams(params.period, params.month);
  const range = params.tab === "summaries" ? dateRange(period, now, timeZone) : null;
  const [records, oldest] = await Promise.all([
    loadAllRecords(repos, {
      serviceTypeId: params.tab === "records" ? params.service || undefined : undefined,
      from: range?.from.toISOString(),
      to: range?.to.toISOString(),
    }),
    repos.records.list({ limit: 1, page: newest.meta.total }),
  ]);
  const firstYear = oldest.data[0]
    ? zonedParts(new Date(oldest.data[0].date), timeZone).year
    : zonedParts(now, timeZone).year;

  return (
    <TimesView
      records={records}
      period={period}
      blockNames={blockNames(records)}
      types={types}
      people={people}
      timeZone={timeZone}
      now={now.toISOString()}
      firstYear={firstYear}
      canManage={can(session, "records.manage")}
    />
  );
}
