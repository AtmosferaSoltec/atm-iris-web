"use client";

import { Pause, Play, Timer, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button, IconButton } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TextField } from "@/components/ui/text-field";
import { timerRemaining } from "@/features/projection/model";
import { cn } from "@/lib/cn";
import { clock } from "@/lib/format";
import type { LiveConsole } from "../use-live-console";

const PRESETS = [
  { label: "30 s", seconds: 30 },
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
];

const MAX_SECONDS = 99 * 60 + 59;

/** "Temporizador": a countdown on the screens (30 s, 5 min…), over whatever was showing. */
export function TimerButton({ ctrl }: { ctrl: LiveConsole }) {
  const { timer } = ctrl;
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!timer?.running) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [timer?.running]);

  const left = timer ? Math.ceil(timerRemaining(timer, Math.max(now, timer.at))) : 0;
  const isDone = timer !== null && left === 0;

  function submit(event: FormEvent) {
    event.preventDefault();
    const total = (Number(minutes) || 0) * 60 + (Number(seconds) || 0);
    if (total > 0) ctrl.startTimer(Math.min(total, MAX_SECONDS));
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Mostrar una cuenta regresiva en la pantalla"
          className={cn(
            "flex h-10 cursor-pointer items-center gap-2.5 rounded-full px-4 text-sm font-medium text-ink ring-1 transition ring-inset hover:bg-surface data-[state=open]:bg-surface",
            timer ? "bg-ember/10 ring-ember/40" : "ring-line",
          )}
        >
          <Timer aria-hidden className="size-4 text-ember" />
          Temporizador
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[320px]">
        <h3 className="mb-3 eyebrow text-ink-2">Temporizador</h3>

        {timer && (
          <div className="mb-4 flex items-center gap-3 rounded-md bg-surface p-3">
            <span className="font-mono text-2xl font-semibold tabular-nums">{clock(left)}</span>
            <div className="ml-auto flex items-center gap-2">
              {!isDone && (
                <IconButton
                  label={timer.running ? "Pausar" : "Seguir"}
                  onClick={timer.running ? ctrl.pauseTimer : ctrl.resumeTimer}
                >
                  {timer.running ? <Pause /> : <Play />}
                </IconButton>
              )}
              <IconButton label="Quitar de la pantalla" onClick={ctrl.hideTimer}>
                <X />
              </IconButton>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.seconds}
              size="sm"
              variant="secondary"
              onClick={() => ctrl.startTimer(preset.seconds)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-4 flex items-end gap-2">
          <TextField
            id="timer-minutes"
            label="Min"
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            placeholder="0"
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
            containerClassName="w-20"
          />
          <TextField
            id="timer-seconds"
            label="Seg"
            type="number"
            inputMode="numeric"
            min={0}
            max={59}
            placeholder="0"
            value={seconds}
            onChange={(event) => setSeconds(event.target.value)}
            containerClassName="w-20"
          />
          <Button type="submit" disabled={!(Number(minutes) > 0 || Number(seconds) > 0)}>
            Iniciar
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
