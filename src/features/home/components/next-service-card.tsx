import { CalendarDays, Plus, Timer } from "lucide-react";
import type { ReactNode } from "react";
import { IrisMark } from "@/components/brand/iris-mark";
import { BlockTimeline } from "@/components/service/block-timeline";
import { ButtonLink } from "@/components/ui/button";
import { ColorDot } from "@/components/ui/chip";
import type { NextService } from "@/domain/next-service";
import { plannedSeconds, spectrumColor, tracksTime } from "@/domain/rules";
import { blocksSummary, scheduleSummary, timeOfDay } from "@/lib/format";

type Props = {
  next: NextService | null;
  timeControl: boolean;
};

/** The iPad's home hero, without "Iniciar servicio": the web doesn't project. */
export function NextServiceCard({ next, timeControl }: Props) {
  if (!next) {
    return (
      <Hero color="var(--color-violet)">
        <div className="flex flex-col gap-4">
          <h2 className="font-serif text-4xl leading-tight font-medium sm:text-[52px]">
            Crea tu primer servicio
          </h2>
          <p className="max-w-md text-[15px] text-ink-2">
            Configura tus tipos de servicio y, si quieres, sus bloques de tiempo.
          </p>
          <div>
            <ButtonLink href="/servicios/nuevo" size="lg" icon={<Plus className="size-4" />}>
              Configurar servicios
            </ButtonLink>
          </div>
        </div>
      </Hero>
    );
  }

  const { type } = next;
  const showsBlocks = timeControl && tracksTime(type);
  const when = !type.schedule
    ? "Sin horario"
    : next.isToday
      ? `Hoy · ${timeOfDay(type.schedule.hour, type.schedule.minute)}`
      : scheduleSummary(type.schedule);

  return (
    <Hero color={type.color}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-4">
          <p className="flex items-center gap-2 eyebrow text-ink-2">
            {next.isToday && (
              <span aria-hidden className="size-2 animate-pulse-live rounded-full bg-live" />
            )}
            {next.isToday ? "Servicio de hoy" : "Próximo servicio"}
          </p>
          <h2 className="font-serif text-4xl leading-tight font-medium sm:text-[52px]">
            {type.name}
          </h2>
          <p className="flex flex-wrap gap-x-5 gap-y-1 text-[15px] text-ink-2">
            <span className="flex items-center gap-1.5">
              <CalendarDays aria-hidden className="size-4" />
              {when}
            </span>
            <span className="flex items-center gap-1.5">
              <Timer aria-hidden className="size-4" />
              {showsBlocks
                ? blocksSummary(type.blocks.length, plannedSeconds(type.blocks))
                : "Solo proyección"}
            </span>
          </p>
        </div>

        {showsBlocks ? (
          <div className="flex flex-col gap-3">
            <p className="eyebrow text-ink-2">Bloques</p>
            <BlockTimeline blocks={type.blocks} />
            <ul className="flex flex-col gap-2">
              {type.blocks.map((block, index) => (
                <li key={block.id} className="flex items-center gap-2.5 text-sm">
                  <ColorDot color={spectrumColor(index)} />
                  <span className="min-w-0 flex-1 truncate font-medium">{block.name}</span>
                  <span className="w-14 text-right text-ink-2 tabular-nums">
                    {block.plannedMinutes} min
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex items-center gap-4 rounded-lg bg-black/40 p-5 ring-1 ring-line">
            <IrisMark size={44} />
            <p className="text-sm text-ink-2">
              Este servicio no controla tiempos: solo proyección.
            </p>
          </div>
        )}
      </div>
    </Hero>
  );
}

function Hero({ color, children }: { color: string; children: ReactNode }) {
  return (
    <section
      aria-label="Próximo servicio"
      className="relative overflow-hidden rounded-2xl bg-elevated p-6 ring-1 ring-line sm:p-10"
      style={{
        backgroundImage: `radial-gradient(circle at 0% 100%, color-mix(in srgb, ${color} 22%, transparent), transparent 55%), radial-gradient(circle at 100% 0%, var(--color-glow-violet), transparent 50%)`,
      }}
    >
      {children}
    </section>
  );
}
