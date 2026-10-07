"use client";

import { Calendar, ChevronDown, ChevronUp, Minus, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Banner } from "@/components/ui/banner";
import { Button, ButtonLink, IconButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { controlStyles } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Surface } from "@/components/ui/surface";
import { TextField } from "@/components/ui/text-field";
import { toast } from "@/components/ui/toaster";
import { BlockTimeline } from "@/components/service/block-timeline";
import type { BlockTemplate, ServiceType } from "@/domain/models";
import { BLOCK_MINUTES, plannedSeconds, SERVICE_PALETTE } from "@/domain/rules";
import { cn } from "@/lib/cn";
import { durationSummary, shortWeekdayName } from "@/lib/format";
import type { FormState } from "@/lib/form-state";
import { nameKey } from "@/lib/text";
import { deleteServiceType, saveServiceType } from "../actions";
import { BLOCKS_REQUIRED, SERVICE_TYPE_DUPLICATE, type ServiceTypeField } from "../schemas";

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);
const pad = (value: number) => String(value).padStart(2, "0");

type Props = {
  serviceType?: ServiceType;
  timeControlEnabled: boolean;
  /** Names of the other service types, to flag duplicates before saving. */
  otherNames: string[];
};

type Result = Pick<FormState<ServiceTypeField>, "message" | "fieldErrors">;

function newBlock(): BlockTemplate {
  return {
    id: crypto.randomUUID(),
    name: "Nuevo bloque",
    plannedMinutes: BLOCK_MINUTES.default,
  };
}

function clampMinutes(value: number): number {
  if (Number.isNaN(value)) return BLOCK_MINUTES.min;
  return Math.min(BLOCK_MINUTES.max, Math.max(BLOCK_MINUTES.min, Math.round(value)));
}

/** Works on a local copy; only "Guardar" persists (IRIS_SPEC §6.8). */
export function ServiceTypeEditor({ serviceType, timeControlEnabled, otherNames }: Props) {
  const router = useRouter();
  const [name, setName] = useState(serviceType?.name ?? "");
  const [color, setColor] = useState(serviceType?.color ?? SERVICE_PALETTE[0].value);
  const [hasSchedule, setHasSchedule] = useState(Boolean(serviceType?.schedule));
  const [weekday, setWeekday] = useState(serviceType?.schedule?.weekday ?? 1);
  const [hour, setHour] = useState(serviceType?.schedule?.hour ?? 10);
  const [minute, setMinute] = useState(serviceType?.schedule?.minute ?? 0);
  const [tracksTime, setTracksTime] = useState((serviceType?.blocks.length ?? 0) > 0);
  const [blocks, setBlocks] = useState<BlockTemplate[]>(serviceType?.blocks ?? []);

  const [result, setResult] = useState<Result>({});
  const [isSaving, startSaving] = useTransition();
  const [isConfirmingBlockRemoval, setIsConfirmingBlockRemoval] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, startDeleting] = useTransition();

  const showsBlocks = timeControlEnabled && tracksTime;
  const hasEmptyBlockName = showsBlocks && blocks.some((block) => !block.name.trim());
  const canSave =
    name.trim().length > 0 && !hasEmptyBlockName && !(showsBlocks && blocks.length === 0);
  const nameError = result.fieldErrors?.name;
  const blocksError =
    result.fieldErrors?.blocks ??
    (showsBlocks && blocks.length === 0 ? BLOCKS_REQUIRED : undefined);

  function updateBlock(id: string, change: Partial<BlockTemplate>) {
    setBlocks((current) =>
      current.map((block) => (block.id === id ? { ...block, ...change } : block)),
    );
  }

  function moveBlock(index: number, offset: -1 | 1) {
    setBlocks((current) => {
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(index + offset, 0, moved);
      return next;
    });
  }

  function setTimeTracking(isOn: boolean) {
    if (isOn) {
      setTracksTime(true);
      if (blocks.length === 0) setBlocks([newBlock()]);
    } else if (blocks.length > 0) {
      setIsConfirmingBlockRemoval(true);
    } else {
      setTracksTime(false);
    }
  }

  function save() {
    if (otherNames.some((other) => nameKey(other) === nameKey(name))) {
      setResult({ fieldErrors: { name: SERVICE_TYPE_DUPLICATE } });
      return;
    }
    setResult({});
    startSaving(async () => {
      const response = await saveServiceType({
        id: serviceType?.id ?? null,
        name,
        color,
        schedule: hasSchedule ? { weekday, hour, minute } : null,
        tracksTime: showsBlocks,
        blocks: showsBlocks ? blocks : [],
      });
      if (response.status === "success") {
        toast.success("Servicio guardado");
        router.push("/servicios");
      } else setResult(response);
    });
  }

  function confirmDelete() {
    if (!serviceType) return;
    startDeleting(async () => {
      const response = await deleteServiceType(serviceType.id);
      if (response.error) {
        setResult({ message: response.error });
        setIsConfirmingDelete(false);
        return;
      }
      toast.success(`Se eliminó ${serviceType.name}`);
      router.push("/servicios");
    });
  }

  return (
    <form
      className="flex flex-col gap-6"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (canSave) save();
      }}
    >
      {result.message && <Banner tone="error">{result.message}</Banner>}

      <Surface className="flex flex-col gap-8 p-6 sm:p-8">
        <TextField
          id="name"
          label="Nombre"
          placeholder="Ej. Culto general"
          icon={<Calendar />}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (nameError)
              setResult((current) => ({
                ...current,
                fieldErrors: { ...current.fieldErrors, name: undefined },
              }));
          }}
          error={nameError}
          containerClassName="max-w-md"
          autoFocus={!serviceType}
        />

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 eyebrow text-ink-2">Color</legend>
          <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Color">
            {SERVICE_PALETTE.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={color === option.value}
                aria-label={option.name}
                title={option.name}
                onClick={() => setColor(option.value)}
                className={cn(
                  "size-9 cursor-pointer rounded-full ring-offset-2 ring-offset-elevated transition active:scale-95",
                  color === option.value ? "ring-2 ring-white" : "hover:scale-105",
                )}
                style={{ backgroundColor: option.value }}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-3 eyebrow text-ink-2">Horario</legend>
          <label className="flex items-center justify-between gap-4">
            <span className="font-semibold">Tiene horario fijo</span>
            <Switch
              label="Tiene horario fijo"
              checked={hasSchedule}
              onCheckedChange={setHasSchedule}
            />
          </label>
          {hasSchedule && (
            <div className="flex animate-fade-in flex-wrap items-center gap-4">
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Día">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    role="radio"
                    aria-checked={weekday === day}
                    onClick={() => setWeekday(day)}
                    className={cn(
                      "h-9 min-w-12 cursor-pointer rounded-full px-3 text-sm font-semibold transition",
                      weekday === day
                        ? "bg-ink text-ink-inverse"
                        : "bg-surface text-ink-2 ring-1 ring-line ring-inset hover:text-ink",
                    )}
                  >
                    {shortWeekdayName(day)}
                  </button>
                ))}
              </div>
              {/* Two selects instead of <input type="time">, which follows the OS 12/24 h setting. */}
              <div className="flex items-center gap-2" role="group" aria-label="Hora">
                <span className="text-[13px] font-medium text-ink-2">Hora</span>
                <NativeSelect
                  id="schedule-hour"
                  aria-label="Hora"
                  value={hour}
                  onChange={(event) => setHour(Number(event.target.value))}
                  className="h-10 w-20 pl-3 tabular-nums"
                >
                  {HOURS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </NativeSelect>
                <span className="text-ink-3">:</span>
                <NativeSelect
                  id="schedule-minute"
                  aria-label="Minutos"
                  value={minute}
                  onChange={(event) => setMinute(Number(event.target.value))}
                  className="h-10 w-20 pl-3 tabular-nums"
                >
                  {MINUTES.includes(minute) ? null : <option value={minute}>{pad(minute)}</option>}
                  {MINUTES.map((value) => (
                    <option key={value} value={value}>
                      {pad(value)}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>
          )}
        </fieldset>

        {timeControlEnabled && (
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-3 eyebrow text-ink-2">Control de tiempo</legend>
            <label className="flex items-center justify-between gap-4">
              <span>
                <span className="block font-semibold">Controlar el tiempo de este servicio</span>
                <span className="block text-sm text-ink-2">
                  Divide el servicio en bloques con un tiempo previsto y un responsable.
                </span>
              </span>
              <Switch
                label="Controlar el tiempo de este servicio"
                checked={tracksTime}
                onCheckedChange={setTimeTracking}
              />
            </label>

            {tracksTime && (
              <div className="flex animate-fade-in flex-col gap-4">
                {blocks.length > 0 && (
                  <ol className="flex flex-col gap-2">
                    {blocks.map((block, index) => (
                      <li
                        key={block.id}
                        className="flex flex-wrap items-center gap-2 rounded-md bg-surface p-2 ring-1 ring-line ring-inset sm:flex-nowrap"
                      >
                        <span className="w-7 text-center text-xs text-ink-2 tabular-nums">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <input
                          aria-label={`Nombre del bloque ${index + 1}`}
                          value={block.name}
                          onChange={(event) => updateBlock(block.id, { name: event.target.value })}
                          placeholder="Nombre del bloque"
                          className={cn(
                            controlStyles(!block.name.trim()),
                            "h-10 min-w-40 flex-1 px-3",
                          )}
                        />
                        <div
                          className="flex items-center gap-1"
                          role="group"
                          aria-label={`Minutos de ${block.name || "bloque"}`}
                        >
                          <IconButton
                            label="Menos minutos"
                            onClick={() =>
                              updateBlock(block.id, {
                                plannedMinutes: clampMinutes(block.plannedMinutes - 1),
                              })
                            }
                            disabled={block.plannedMinutes <= BLOCK_MINUTES.min}
                          >
                            <Minus />
                          </IconButton>
                          <label className="relative">
                            <span className="sr-only">Minutos previstos</span>
                            <input
                              type="number"
                              inputMode="numeric"
                              min={BLOCK_MINUTES.min}
                              max={BLOCK_MINUTES.max}
                              value={block.plannedMinutes}
                              onChange={(event) =>
                                updateBlock(block.id, {
                                  plannedMinutes: clampMinutes(event.target.valueAsNumber),
                                })
                              }
                              className={cn(
                                controlStyles(),
                                "h-10 w-20 [appearance:textfield] pr-9 pl-3 text-right tabular-nums [&::-webkit-inner-spin-button]:appearance-none",
                              )}
                            />
                            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-ink-2">
                              min
                            </span>
                          </label>
                          <IconButton
                            label="Más minutos"
                            onClick={() =>
                              updateBlock(block.id, {
                                plannedMinutes: clampMinutes(block.plannedMinutes + 1),
                              })
                            }
                            disabled={block.plannedMinutes >= BLOCK_MINUTES.max}
                          >
                            <Plus />
                          </IconButton>
                        </div>
                        <div className="ml-auto flex items-center gap-1">
                          <IconButton
                            label="Mover arriba"
                            onClick={() => moveBlock(index, -1)}
                            disabled={index === 0}
                          >
                            <ChevronUp />
                          </IconButton>
                          <IconButton
                            label="Mover abajo"
                            onClick={() => moveBlock(index, 1)}
                            disabled={index === blocks.length - 1}
                          >
                            <ChevronDown />
                          </IconButton>
                          <IconButton
                            label="Eliminar bloque"
                            className="hover:text-danger"
                            onClick={() =>
                              setBlocks((current) => current.filter((b) => b.id !== block.id))
                            }
                          >
                            <Trash2 />
                          </IconButton>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
                {blocksError && <Banner tone="error">{blocksError}</Banner>}
                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Plus className="size-4" />}
                    onClick={() => setBlocks((current) => [...current, newBlock()])}
                  >
                    Agregar bloque
                  </Button>
                  {blocks.length > 0 && (
                    <div className="flex min-w-60 flex-1 items-center gap-4">
                      <BlockTimeline blocks={blocks} className="flex-1" />
                      <span className="text-sm whitespace-nowrap text-ink-2 tabular-nums">
                        Total previsto:{" "}
                        <strong className="text-ink">
                          {durationSummary(plannedSeconds(blocks))}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </fieldset>
        )}
      </Surface>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          size="lg"
          isLoading={isSaving}
          disabled={!canSave}
          className="min-w-44"
        >
          Guardar
        </Button>
        <ButtonLink href="/servicios" variant="ghost" size="lg">
          Cancelar
        </ButtonLink>
        {serviceType && (
          <Button
            variant="ghost"
            className="ml-auto text-danger hover:text-danger"
            icon={<Trash2 className="size-4" />}
            onClick={() => setIsConfirmingDelete(true)}
          >
            Eliminar servicio
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={isConfirmingBlockRemoval}
        onClose={() => setIsConfirmingBlockRemoval(false)}
        onConfirm={() => {
          setBlocks([]);
          setTracksTime(false);
          setIsConfirmingBlockRemoval(false);
        }}
        title="¿Quitar los bloques?"
        description="El servicio quedará solo para proyectar."
        confirmLabel="Quitar bloques"
      />
      <ConfirmDialog
        open={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        onConfirm={confirmDelete}
        isPending={isDeleting}
        title={`¿Eliminar ${serviceType?.name ?? ""}?`}
        description="Sus tiempos guardados se conservan."
        confirmLabel="Eliminar"
      />
    </form>
  );
}
