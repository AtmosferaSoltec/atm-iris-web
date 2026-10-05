import { CalendarDays, Timer } from "lucide-react";
import Link from "next/link";
import { BlockTimeline } from "@/components/service/block-timeline";
import { Chip } from "@/components/ui/chip";
import type { ServiceType } from "@/domain/models";
import { plannedSeconds, tracksTime } from "@/domain/rules";
import { blocksSummary, scheduleSummary } from "@/lib/format";

const cardStyles =
  "group relative flex w-full flex-col gap-4 overflow-hidden rounded-xl surface-panel p-6 pt-7";

/** Opens the editor for roles that can edit; a plain card for the rest. */
export function ServiceTypeCard({
  type,
  timeControlEnabled,
  canEdit,
}: {
  type: ServiceType;
  timeControlEnabled: boolean;
  canEdit: boolean;
}) {
  const content = <ServiceTypeCardContent type={type} timeControlEnabled={timeControlEnabled} />;
  if (!canEdit) return <article className={cardStyles}>{content}</article>;
  return (
    <Link
      href={`/servicios/${type.id}`}
      aria-label={`Editar ${type.name}`}
      className={`${cardStyles} transition hover:-translate-y-0.5 hover:bg-surface-raised active:scale-[0.99]`}
    >
      {content}
    </Link>
  );
}

function ServiceTypeCardContent({
  type,
  timeControlEnabled,
}: {
  type: ServiceType;
  timeControlEnabled: boolean;
}) {
  const showsBlocks = timeControlEnabled && tracksTime(type);
  return (
    <>
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: type.color }}
      />
      <div>
        <h2 className="font-serif text-[26px] leading-tight font-medium">{type.name}</h2>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-2">
          <CalendarDays aria-hidden className="size-4 text-ink-3" />
          {type.schedule ? scheduleSummary(type.schedule) : "Sin horario"}
        </p>
      </div>
      <div className="mt-auto flex flex-col gap-3">
        {showsBlocks && <BlockTimeline blocks={type.blocks} />}
        <div>
          {showsBlocks ? (
            <Chip color="var(--color-success)" icon={<Timer />}>
              {blocksSummary(type.blocks.length, plannedSeconds(type.blocks))}
            </Chip>
          ) : (
            <Chip>Solo proyección</Chip>
          )}
        </div>
      </div>
    </>
  );
}
