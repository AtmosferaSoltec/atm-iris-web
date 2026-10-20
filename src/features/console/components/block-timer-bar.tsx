"use client";

import {
  Check,
  ChevronDown,
  CircleCheck,
  Play,
  Plus,
  SkipForward,
  Timer,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { Banner } from "@/components/ui/banner";
import { Button, IconButton } from "@/components/ui/button";
import { ColorDot } from "@/components/ui/chip";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Surface } from "@/components/ui/surface";
import { TextField } from "@/components/ui/text-field";
import type { Person, ServiceType } from "@/domain/models";
import { plannedSeconds } from "@/domain/rules";
import { cn } from "@/lib/cn";
import { blocksSummary, clock, overtime } from "@/lib/format";
import { createConsoleService } from "../actions";
import {
  clockState,
  elapsedSeconds,
  nextIndex,
  totals,
  type ClockState,
  type ServiceTimer,
} from "../block-timer";
import type { Leader, ServiceTimerControls } from "../use-service-timer";

const CLOCK_TEXT: Record<ClockState, string> = {
  normal: "text-ink",
  warning: "text-warning",
  over: "text-danger",
};
const CLOCK_BAR: Record<ClockState, string> = {
  normal: "bg-success",
  warning: "bg-warning",
  over: "bg-danger",
};

/**
 * BLOQUES (IRIS_SPEC §6.9), always above the open item: choose the service, start it, move
 * through its blocks and finish it. One service at a time, until "Finalizar servicio".
 */
export function BlockTimerBar({
  service,
  people,
}: {
  service: ServiceTimerControls;
  people: Person[];
}) {
  const timer = service.timer;
  const [isChoosing, setIsChoosing] = useState(false);
  const [changingLeader, setChangingLeader] = useState<number | null>(null);
  const [isConfirmingFinish, setIsConfirmingFinish] = useState(false);
  const next = timer ? nextIndex(timer) : null;

  return (
    <Surface className="flex flex-col gap-3 px-5 py-4">
      {!service.serviceType ? (
        <Idle
          title="Bloques"
          text="Elige el servicio que vas a dirigir para llevar sus tiempos."
          action={
            <Button icon={<Timer className="size-4" />} onClick={() => setIsChoosing(true)}>
              Seleccionar servicio
            </Button>
          }
        />
      ) : !timer ? (
        <Idle
          title={service.serviceType.name}
          text="Este servicio no tiene bloques: solo se proyecta. Agrégale bloques en Servicios para llevar sus tiempos."
          action={
            <Button variant="secondary" onClick={() => setIsChoosing(true)}>
              Cambiar servicio
            </Button>
          }
        />
      ) : timer.phase === "notStarted" ? (
        <Idle
          title={service.serviceType.name}
          text={blocksSummary(
            timer.blocks.length,
            timer.blocks.reduce((sum, block) => sum + block.plannedSeconds, 0),
          )}
          action={
            <>
              <Button variant="ghost" onClick={() => setIsChoosing(true)}>
                Cambiar
              </Button>
              <Button
                icon={<Play className="size-4" fill="currentColor" />}
                className="w-[200px]"
                onClick={service.startNext}
              >
                Comenzar
              </Button>
            </>
          }
        />
      ) : timer.phase === "running" && timer.current !== null ? (
        <Running
          timer={timer}
          now={service.now}
          next={next}
          onChangeLeader={() => setChangingLeader(timer.current)}
          onNext={service.startNext}
          onSkipNext={service.skipNext}
          onFinish={() => setIsConfirmingFinish(true)}
        />
      ) : (
        <Finished timer={timer} now={service.now} onNew={service.clear} />
      )}

      {service.saveError && (
        <Banner tone="error">
          {service.saveError}{" "}
          <button
            type="button"
            onClick={service.retrySave}
            className="cursor-pointer font-semibold underline"
          >
            Reintentar
          </button>
        </Banner>
      )}
      {timer && timer.phase !== "notStarted" && <Breadcrumbs timer={timer} now={service.now} />}

      {isChoosing && (
        <ChooseServiceDialog
          types={service.types}
          currentId={service.serviceType?.id ?? null}
          onClose={() => setIsChoosing(false)}
          onChoose={(type) => {
            service.choose(type);
            setIsChoosing(false);
          }}
          onCreated={(type) => {
            service.addType(type);
            service.choose(type);
            setIsChoosing(false);
          }}
        />
      )}
      {changingLeader !== null && timer && (
        <LeaderDialog
          blockName={timer.blocks[changingLeader].name}
          people={people}
          initialId={timer.blocks[changingLeader].personId}
          onClose={() => setChangingLeader(null)}
          onConfirm={(leader) => {
            service.setLeader(changingLeader, leader);
            setChangingLeader(null);
          }}
        />
      )}
      <ConfirmDialog
        open={isConfirmingFinish}
        onClose={() => setIsConfirmingFinish(false)}
        onConfirm={() => {
          service.finish();
          setIsConfirmingFinish(false);
        }}
        title="¿Finalizar el servicio?"
        description="Se guardan los tiempos de los bloques en Tiempos."
        confirmLabel="Finalizar"
      />
    </Surface>
  );
}

function Idle({ title, text, action }: { title: string; text: string; action: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h2 className="truncate eyebrow text-ink-2">{title}</h2>
        <p className="text-sm">{text}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{action}</div>
    </div>
  );
}

function Running({
  timer,
  now,
  next,
  onChangeLeader,
  onNext,
  onSkipNext,
  onFinish,
}: {
  timer: ServiceTimer;
  now: number;
  next: number | null;
  onChangeLeader: () => void;
  onNext: () => void;
  onSkipNext: () => void;
  onFinish: () => void;
}) {
  const block = timer.blocks[timer.current!];
  const elapsed = elapsedSeconds(block, now);
  const state = clockState(elapsed, block.plannedSeconds);
  const left = block.plannedSeconds - Math.floor(elapsed);
  const ratio = block.plannedSeconds > 0 ? Math.min(1, elapsed / block.plannedSeconds) : 1;

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2">
            <span className="size-2 animate-pulse-live rounded-full bg-live" />
            <span className="truncate eyebrow">{block.name}</span>
            <button
              type="button"
              onClick={onChangeLeader}
              title="Elegir quién dirige este bloque"
              className="flex cursor-pointer items-center gap-1 text-sm text-ink-2 hover:text-ink"
            >
              · {block.personName ?? "Sin responsable"}
              <ChevronDown aria-hidden className="size-3.5" />
            </button>
          </p>
          <p className="mt-1 flex items-baseline gap-2">
            <span
              className={cn("font-mono text-3xl font-semibold tabular-nums", CLOCK_TEXT[state])}
            >
              {clock(Math.floor(elapsed))}
            </span>
            <span className="font-mono text-ink-2 tabular-nums">
              / {clock(block.plannedSeconds)}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-mono text-xs tabular-nums",
                state === "over" ? "bg-danger/15 text-danger" : "bg-surface-raised text-ink-2",
              )}
            >
              {left >= 0 ? clock(-left) : overtime(-left)}
            </span>
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {next !== null && (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon={<SkipForward className="size-4" />}
                onClick={onSkipNext}
              >
                Omitir {timer.blocks[next].name}
              </Button>
              <Button className="min-w-[220px]" onClick={onNext}>
                Siguiente: {timer.blocks[next].name} →
              </Button>
            </>
          )}
          <Button variant={next === null ? "primary" : "secondary"} onClick={onFinish}>
            Finalizar servicio
          </Button>
        </div>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-surface-raised">
        <div
          className={cn("h-full rounded-full transition-[width]", CLOCK_BAR[state])}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </>
  );
}

function Finished({ timer, now, onNew }: { timer: ServiceTimer; now: number; onNew: () => void }) {
  const { actual, planned, overtime: over } = totals(timer, now);
  return (
    <div className="flex items-center gap-3">
      <CircleCheck aria-hidden className="size-5 text-success" />
      <p className="flex-1 text-sm">
        <span className="font-semibold">Servicio finalizado</span> · {clock(actual)} (previsto{" "}
        {clock(planned)} · {over > 0 ? overtime(over) : "a tiempo"})
      </p>
      <Link href="/times" className="text-sm font-semibold text-coral hover:underline">
        Ver en Tiempos
      </Link>
      <Button variant="secondary" size="sm" onClick={onNew}>
        Nuevo servicio
      </Button>
    </div>
  );
}

/** Finished blocks with ✓ and their time, the current one live, pending dimmed, skipped struck. */
function Breadcrumbs({ timer, now }: { timer: ServiceTimer; now: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
      {timer.blocks.map((block, index) => {
        const isCurrent = index === timer.current;
        const isDone = block.endedAt !== null && !block.isSkipped;
        const elapsed = elapsedSeconds(block, now);
        return (
          <li key={block.id} className="flex items-center gap-1.5">
            {index > 0 && <span className="text-ink-3">·</span>}
            <span
              className={cn(
                block.isSkipped && "text-ink-3 line-through",
                isCurrent && "font-semibold text-ink",
                !isCurrent && !isDone && !block.isSkipped && "text-ink-2",
                isDone && (elapsed > block.plannedSeconds ? "text-danger" : "text-ink"),
              )}
            >
              {block.name}
              {isDone && ` ✓ ${clock(Math.round(elapsed))}`}
            </span>
            {isCurrent && <span className="size-1.5 rounded-full bg-live" />}
          </li>
        );
      })}
    </ol>
  );
}

/** "Seleccionar servicio": the church's services, or a simple form to create one. */
function ChooseServiceDialog({
  types,
  currentId,
  onClose,
  onChoose,
  onCreated,
}: {
  types: ServiceType[];
  currentId: string | null;
  onClose: () => void;
  onChoose: (type: ServiceType) => void;
  onCreated: (type: ServiceType) => void;
}) {
  const [isCreating, setIsCreating] = useState(types.length === 0);

  return (
    <Dialog
      open
      onClose={onClose}
      title={isCreating ? "Crear servicio" : "Seleccionar servicio"}
      description={
        isCreating
          ? "Ponle un nombre y sus bloques. Puedes cambiarlos después en Servicios."
          : "Sus bloques se cargan para llevar los tiempos."
      }
      size="md"
    >
      {isCreating ? (
        <CreateServiceForm
          onCreated={onCreated}
          onCancel={types.length > 0 ? () => setIsCreating(false) : onClose}
        />
      ) : (
        <div className="flex flex-col gap-2 pb-6">
          {types.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => onChoose(type)}
              aria-current={type.id === currentId ? "true" : undefined}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md px-4 py-3 text-left ring-1 transition ring-inset",
                type.id === currentId
                  ? "bg-surface-raised ring-coral/60"
                  : "ring-line hover:bg-surface",
              )}
            >
              <ColorDot color={type.color} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{type.name}</span>
                <span className="block text-xs text-ink-2">
                  {type.blocks.length > 0
                    ? blocksSummary(type.blocks.length, plannedSeconds(type.blocks))
                    : "Sin bloques · solo proyección"}
                </span>
              </span>
            </button>
          ))}
          <Button
            variant="ghost"
            icon={<Plus className="size-4" />}
            className="mt-2 self-start"
            onClick={() => setIsCreating(true)}
          >
            Crear servicio
          </Button>
        </div>
      )}
    </Dialog>
  );
}

type DraftBlock = { key: number; name: string; minutes: string };

const BLOCK_EXAMPLES = ["Bienvenida", "Alabanza", "Mensaje", "Ofrenda"];

function CreateServiceForm({
  onCreated,
  onCancel,
}: {
  onCreated: (type: ServiceType) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [blocks, setBlocks] = useState<DraftBlock[]>([{ key: 1, name: "", minutes: "10" }]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();

  function update(key: number, change: Partial<DraftBlock>) {
    setBlocks((current) =>
      current.map((block) => (block.key === key ? { ...block, ...change } : block)),
    );
  }

  function save() {
    setError(null);
    startSave(async () => {
      const result = await createConsoleService({
        name,
        blocks: blocks.map((block) => ({
          name: block.name,
          plannedMinutes: Number(block.minutes),
        })),
      });
      if (result.serviceType) onCreated(result.serviceType);
      else setError(result.error ?? "No pudimos crear el servicio.");
    });
  }

  return (
    <form
      className="flex flex-col gap-4 pb-6"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      {error && <Banner tone="error">{error}</Banner>}
      <TextField
        id="quick-service-name"
        label="Nombre"
        placeholder="Ej. Culto general"
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoFocus
      />
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium text-ink-2">Bloques</span>
        {blocks.map((block, index) => (
          <div key={block.key} className="flex items-center gap-2">
            <TextField
              id={`quick-block-${block.key}`}
              aria-label={`Nombre del bloque ${index + 1}`}
              placeholder={BLOCK_EXAMPLES[index] ?? "Bloque"}
              value={block.name}
              onChange={(event) => update(block.key, { name: event.target.value })}
              containerClassName="flex-1"
            />
            <TextField
              id={`quick-minutes-${block.key}`}
              aria-label={`Minutos del bloque ${index + 1}`}
              type="number"
              min={1}
              max={240}
              value={block.minutes}
              onChange={(event) => update(block.key, { minutes: event.target.value })}
              containerClassName="w-24"
            />
            <span className="text-xs text-ink-2">min</span>
            <IconButton
              label={`Quitar el bloque ${index + 1}`}
              disabled={blocks.length === 1}
              onClick={() =>
                setBlocks((current) => current.filter((item) => item.key !== block.key))
              }
            >
              <Trash2 />
            </IconButton>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          icon={<Plus className="size-4" />}
          className="self-start"
          onClick={() =>
            setBlocks((current) => [
              ...current,
              { key: (current.at(-1)?.key ?? 0) + 1, name: "", minutes: "10" },
            ])
          }
        >
          Agregar bloque
        </Button>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSaving}>
          Crear y seleccionar
        </Button>
      </div>
    </form>
  );
}

/** "¿Quién dirige {bloque}?" (IRIS_SPEC §6.9), from the leader's name while it runs. */
function LeaderDialog({
  blockName,
  people,
  initialId,
  onClose,
  onConfirm,
}: {
  blockName: string;
  people: Person[];
  initialId: string | null;
  onClose: () => void;
  onConfirm: (leader: Leader) => void;
}) {
  const [selected, setSelected] = useState<string | null>(initialId);
  const leaderOf = (id: string | null): Leader => {
    const person = people.find((candidate) => candidate.id === id);
    return person ? { id: person.id, name: person.name } : { id: null, name: null };
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={`¿Quién dirige ${blockName}?`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => onConfirm({ id: null, name: null })}>
            Sin responsable
          </Button>
          <Button onClick={() => onConfirm(leaderOf(selected))}>Guardar</Button>
        </>
      }
    >
      {people.length === 0 ? (
        <p className="pb-4 text-sm text-ink-2">Aún no hay personas. Agrégalas en Personas.</p>
      ) : (
        <ul className="flex max-h-[50vh] flex-col gap-1 overflow-y-auto pb-4" role="radiogroup">
          {people.map((person) => (
            <li key={person.id}>
              <button
                type="button"
                role="radio"
                aria-checked={selected === person.id}
                onClick={() => setSelected(person.id)}
                onDoubleClick={() => onConfirm(leaderOf(person.id))}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm transition",
                  selected === person.id ? "bg-surface-raised font-semibold" : "hover:bg-surface",
                )}
              >
                {person.name}
                {selected === person.id && <Check aria-hidden className="size-4 text-coral" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
