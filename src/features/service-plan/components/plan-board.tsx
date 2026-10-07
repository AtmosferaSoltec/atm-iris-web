"use client";

import { ChevronDown, ChevronUp, ListChecks, Plus, Quote, X } from "lucide-react";
import { useState, useTransition } from "react";
import { Button, IconButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Surface } from "@/components/ui/surface";
import { toast } from "@/components/ui/toaster";
import type { MediaKind, ServicePlanItem } from "@/domain/models";
import { KIND_ICONS, KIND_LABELS } from "@/features/media/media-format";
import { clearPlan, movePlanItem, removePlanItem } from "../actions";
import { AddToPlanDialog } from "./add-to-plan-dialog";

export type PlanRow = {
  item: ServicePlanItem;
  title: string;
  /** Author, for a song. */
  subtitle: string | null;
  /** Set for a media item. */
  mediaKind: MediaKind | null;
  /** Only an image gets a thumbnail; video/audio just show an icon. */
  thumbnailUrl: string | null;
};

type Props = { rows: PlanRow[]; canAddMedia: boolean };

export function PlanBoard({ rows, canAddMedia }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [clearError, setClearError] = useState<string>();

  function move(id: string, position: number) {
    startTransition(async () => {
      const result = await movePlanItem(id, position);
      if (result.error) toast.error(result.error);
    });
  }

  function remove(row: PlanRow) {
    startTransition(async () => {
      const result = await removePlanItem(row.item.id);
      if (result.error) toast.error(result.error);
      else toast.success(`Se quitó «${row.title}» del plan`);
    });
  }

  function confirmClear() {
    startTransition(async () => {
      const result = await clearPlan();
      if (result.error) {
        setClearError(result.error);
        return;
      }
      setIsConfirmingClear(false);
      toast.success("Se vació el plan");
    });
  }

  return (
    <div className="mx-auto flex max-w-content flex-col gap-8">
      <PageHeader
        title="Plan"
        description="Adelanta desde aquí lo que se va a presentar en el próximo servicio: al abrir el iPad o la computadora, ya va a estar cargado."
        actions={
          <>
            {rows.length > 0 && (
              <Button
                variant="ghost"
                className="text-danger hover:text-danger"
                onClick={() => {
                  setClearError(undefined);
                  setIsConfirmingClear(true);
                }}
              >
                Vaciar
              </Button>
            )}
            <Button icon={<Plus className="size-4" />} onClick={() => setIsAdding(true)}>
              Agregar
            </Button>
          </>
        }
      />

      <Surface className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={<ListChecks />}
            title="El plan está vacío"
            description="Agrega canciones o multimedia para el próximo servicio. Lo que elijas aquí va a estar listo apenas abras el iPad o la computadora."
            action={
              <Button icon={<Plus className="size-4" />} onClick={() => setIsAdding(true)}>
                Agregar
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((row, index) => (
              <PlanItemRow
                key={row.item.id}
                row={row}
                isFirst={index === 0}
                isLast={index === rows.length - 1}
                isPending={isPending}
                onMoveUp={() => move(row.item.id, index - 1)}
                onMoveDown={() => move(row.item.id, index + 1)}
                onRemove={() => remove(row)}
              />
            ))}
          </ul>
        )}
      </Surface>

      {isAdding && (
        <AddToPlanDialog
          canAddMedia={canAddMedia}
          existingRefIds={rows.map((row) => row.item.refId)}
          onClose={() => setIsAdding(false)}
        />
      )}

      <ConfirmDialog
        open={isConfirmingClear}
        onClose={() => setIsConfirmingClear(false)}
        onConfirm={confirmClear}
        title="¿Vaciar el plan?"
        description="Se va a quitar todo lo que adelantaste. El iPad y la computadora también lo van a reflejar la próxima vez que sincronicen."
        confirmLabel="Vaciar"
        isPending={isPending}
        error={clearError}
      />
    </div>
  );
}

function PlanItemRow({
  row,
  isFirst,
  isLast,
  isPending,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  row: PlanRow;
  isFirst: boolean;
  isLast: boolean;
  isPending: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const Icon = row.mediaKind ? KIND_ICONS[row.mediaKind] : Quote;

  return (
    <li className="flex items-center gap-4 px-4 py-3 sm:px-6">
      <span className="flex flex-col">
        <IconButton
          label="Subir"
          disabled={isFirst || isPending}
          onClick={onMoveUp}
          className="size-7"
        >
          <ChevronUp className="size-4" />
        </IconButton>
        <IconButton
          label="Bajar"
          disabled={isLast || isPending}
          onClick={onMoveDown}
          className="size-7"
        >
          <ChevronDown className="size-4" />
        </IconButton>
      </span>

      <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-md bg-surface ring-1 ring-line">
        {row.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed URLs expire in 1 h
          <img src={row.thumbnailUrl} alt="" className="size-full object-cover" />
        ) : (
          <Icon className="size-5 text-ink-3" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{row.title}</span>
        {(row.subtitle || row.mediaKind) && (
          <span className="block truncate text-sm text-ink-2">
            {row.mediaKind ? KIND_LABELS[row.mediaKind].singular : row.subtitle}
          </span>
        )}
      </span>

      <IconButton label={`Quitar «${row.title}» del plan`} onClick={onRemove} disabled={isPending}>
        <X className="size-4" />
      </IconButton>
    </li>
  );
}
