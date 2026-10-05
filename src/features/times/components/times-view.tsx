"use client";

import { useQueryStates } from "nuqs";
import { useTransition } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { Person, ServiceRecord, ServiceType } from "@/domain/models";
import type { Period } from "@/domain/time-statistics";
import { cn } from "@/lib/cn";
import { timeSearchParams } from "@/lib/search-params";
import { RecordsTab } from "./records-tab";
import { SummariesTab } from "./summaries-tab";

type Props = {
  records: ServiceRecord[];
  period: Period;
  blockNames: string[];
  types: ServiceType[];
  people: Person[];
  timeZone: string;
  now: string;
  firstYear: number;
  canManage: boolean;
};

/** Tab, filters and the selected record live in the URL; the server loads what they ask for. */
export function TimesView(props: Props) {
  const [isLoading, startTransition] = useTransition();
  const [params, setParams] = useQueryStates(timeSearchParams, { shallow: false, startTransition });

  return (
    <div className="mx-auto flex max-w-content flex-col gap-8">
      <PageHeader
        title="Tiempos"
        description="Lo que duró cada bloque de los servicios, según las consolas."
        actions={
          <SegmentedControl
            label="Vista"
            value={params.tab}
            onChange={(tab) => void setParams({ tab })}
            options={[
              { value: "records", label: "Registros" },
              { value: "summaries", label: "Resúmenes" },
            ]}
          />
        }
      />
      <div className={cn("transition-opacity", isLoading && "opacity-60")} aria-busy={isLoading}>
        {params.tab === "records" ? (
          <RecordsTab
            records={props.records}
            types={props.types}
            people={props.people}
            timeZone={props.timeZone}
            canManage={props.canManage}
            serviceFilter={params.service}
            selectedId={params.record}
            onServiceFilter={(service) =>
              void setParams({ service: service || null, record: null })
            }
            onSelect={(record) => void setParams({ record: record || null }, { shallow: true })}
          />
        ) : (
          <SummariesTab
            records={props.records}
            params={params}
            period={props.period}
            blockNames={props.blockNames}
            types={props.types}
            people={props.people}
            timeZone={props.timeZone}
            now={props.now}
            firstYear={props.firstYear}
            onChange={(change) =>
              void setParams(
                Object.fromEntries(
                  Object.entries(change).map(([key, value]) => [key, value || null]),
                ),
              )
            }
          />
        )}
      </div>
    </div>
  );
}
