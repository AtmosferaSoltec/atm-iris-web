"use client";

import { ChevronLeft, MonitorUp, Tv } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { IrisWordmark } from "@/components/brand/iris-mark";
import { cn } from "@/lib/cn";
import type { LiveConsole } from "../use-live-console";
import { DisplaysDialog } from "./displays-dialog";

/** Chrome's Window Management API: lets "Abrir pantalla" land on the second monitor. */
type ScreenDetails = {
  screens: {
    availLeft: number;
    availTop: number;
    availWidth: number;
    availHeight: number;
    isPrimary: boolean;
  }[];
  currentScreen: unknown;
};
declare global {
  interface Window {
    getScreenDetails?: () => Promise<ScreenDetails>;
  }
}

/** IRIS_SPEC §6.2 top bar: back home, the service, the clock and the screens' status. */
export function ConsoleTopBar({
  ctrl,
  churchName,
  serviceName,
}: {
  ctrl: LiveConsole;
  churchName: string;
  serviceName: string | null;
}) {
  const connected = ctrl.screens.length;
  const tvs = ctrl.remote.displays;
  const tvsOnline = tvs.filter((display) => display.online).length;
  const [isManagingTvs, setIsManagingTvs] = useState(false);

  return (
    <header className="flex h-[68px] shrink-0 items-center gap-4 px-6">
      <Link
        href="/"
        className="flex h-9 items-center gap-1 rounded-full px-3 text-sm font-medium text-ink-2 ring-1 ring-line transition ring-inset hover:bg-surface hover:text-ink"
      >
        <ChevronLeft aria-hidden className="size-4" />
        Inicio
      </Link>
      <IrisWordmark height={24} />
      <span aria-hidden className="h-7 w-px bg-line" />
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold">{serviceName ?? "Servicio"}</p>
        <p className="truncate text-xs text-ink-2">{churchName}</p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Clock />
        <button
          type="button"
          onClick={() => setIsManagingTvs(true)}
          title="Conecta un televisor con internet, sin cables"
          className={cn(
            "flex h-10 cursor-pointer items-center gap-2.5 rounded-full px-4 text-sm font-medium ring-1 transition ring-inset",
            tvsOnline > 0
              ? "bg-success/10 text-ink ring-success/30 hover:bg-success/16"
              : "text-ink ring-line hover:bg-surface",
          )}
        >
          <Tv aria-hidden className={cn("size-4", tvsOnline > 0 ? "text-success" : "text-ink-2")} />
          {tvs.length === 0
            ? "Conectar televisor"
            : tvsOnline === 0
              ? "Televisores apagados"
              : tvsOnline === 1
                ? "1 televisor"
                : `${tvsOnline} televisores`}
        </button>
        {isManagingTvs && <DisplaysDialog ctrl={ctrl} onClose={() => setIsManagingTvs(false)} />}
        <button
          type="button"
          onClick={() => void openScreen()}
          title={
            connected > 0
              ? "Abrir otra pantalla"
              : "Abre la pantalla en tu segundo monitor o en el TV"
          }
          className={cn(
            "flex h-10 cursor-pointer items-center gap-2.5 rounded-full px-4 text-sm font-medium ring-1 transition ring-inset",
            connected > 0
              ? "bg-success/10 text-ink ring-success/30 hover:bg-success/16"
              : "bg-warning/10 text-ink ring-warning/30 hover:bg-warning/16",
          )}
        >
          {connected > 0 ? (
            <Tv aria-hidden className="size-4 text-success" />
          ) : (
            <MonitorUp aria-hidden className="size-4 text-warning" />
          )}
          {connected === 0
            ? "Abrir pantalla"
            : connected === 1
              ? "Pantalla conectada"
              : `${connected} pantallas conectadas`}
        </button>
      </div>
    </header>
  );
}

/** Re-renders every 15 s; on the server (and the first paint) it shows dashes. */
const subscribeClock = (onChange: () => void) => {
  const timer = setInterval(onChange, 15_000);
  return () => clearInterval(timer);
};
const minuteNow = () => Math.floor(Date.now() / 15_000);

function Clock() {
  const tick = useSyncExternalStore(subscribeClock, minuteNow, () => null);
  return (
    <time className="font-mono text-xl font-semibold tabular-nums">
      {tick === null
        ? "--:--"
        : new Date(tick * 15_000).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
    </time>
  );
}

/**
 * Opens `/display` in its own window. With Chrome's Window Management permission it lands
 * maximized on the other monitor; otherwise it opens here, to be dragged there. Full screen
 * is one click (or F) on the screen itself: browsers only allow it from a gesture there.
 */
async function openScreen() {
  let features = "popup=yes,width=1280,height=720";
  try {
    const details = await window.getScreenDetails?.();
    const other = details?.screens.find((screen) => !screen.isPrimary) ?? null;
    if (other) {
      features = `popup=yes,left=${other.availLeft},top=${other.availTop},width=${other.availWidth},height=${other.availHeight}`;
    }
  } catch {
    // Permission denied or not supported: a normal window.
  }
  window.open("/display", `iris-pantalla-${Date.now()}`, features);
}
