"use client";

import { BookOpen, Quote, SquarePlay, Timer } from "lucide-react";
import { useRef, useState } from "react";
import { Banner } from "@/components/ui/banner";
import { Switch } from "@/components/ui/switch";
import type { ChurchModules, ModuleKey } from "@/domain/models";
import { GENERIC_ERROR } from "@/lib/form-state";
import { saveModules } from "../actions";

type Row = {
  key: ModuleKey | "lyrics";
  title: string;
  description: string;
  icon: typeof Quote;
  color: string;
};

const ROWS: Row[] = [
  {
    key: "lyrics",
    title: "Letras",
    description: "Proyecta letras de canciones y anuncios. Siempre activo.",
    icon: Quote,
    color: "var(--color-ember)",
  },
  {
    key: "bible",
    title: "Biblia",
    description: "Busca y proyecta versículos por libro, capítulo y versículo.",
    icon: BookOpen,
    color: "var(--color-violet)",
  },
  {
    key: "multimedia",
    title: "Multimedia",
    description: "Música, imágenes y videos en la biblioteca y el reproductor.",
    icon: SquarePlay,
    color: "var(--color-rose)",
  },
  {
    key: "timeControl",
    title: "Control de tiempo",
    description: "Mide los bloques de cada servicio y guarda sus tiempos.",
    icon: Timer,
    color: "var(--color-coral)",
  },
];

/** Switches save immediately, one after another; a failed save flips the switch back. */
export function ModuleSettings({ initialModules }: { initialModules: ChurchModules }) {
  const [modules, setModules] = useState(initialModules);
  const [error, setError] = useState<string>();
  const queue = useRef(Promise.resolve());

  // What the server was last asked to store, so chained toggles build on each other.
  const requested = useRef(initialModules);

  function toggle(key: ModuleKey, isOn: boolean) {
    setError(undefined);
    setModules((current) => ({ ...current, [key]: isOn }));
    const next = { ...requested.current, [key]: isOn };
    requested.current = next;
    queue.current = queue.current.then(async () => {
      const result = await saveModules(next).catch(() => ({ error: GENERIC_ERROR }));
      if (result.error) {
        requested.current = { ...requested.current, [key]: !isOn };
        setModules((current) => ({ ...current, [key]: !isOn }));
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Banner tone="error">{error}</Banner>}
      <ul className="divide-y divide-line">
        {ROWS.map(({ key, title, description, icon: Icon, color }) => {
          const isLyrics = key === "lyrics";
          const checked = isLyrics ? true : modules[key];
          return (
            <li key={key} className="flex items-center gap-4 py-5 first:pt-0 last:pb-0">
              <span
                className="grid size-10 shrink-0 place-items-center rounded-sm"
                style={{ color, backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
              >
                <Icon aria-hidden className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-ink-2">{description}</p>
                {key === "timeControl" && !modules.timeControl && (
                  <Banner tone="info" className="mt-3">
                    Los tiempos guardados se conservan. Puedes volver a activarlo cuando quieras.
                  </Banner>
                )}
              </div>
              <Switch
                label={title}
                checked={checked}
                disabled={isLyrics}
                onCheckedChange={(value) => !isLyrics && toggle(key, value)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
