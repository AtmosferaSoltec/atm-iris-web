"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { ConsoleData } from "../model";
import { useLiveConsole } from "../use-live-console";
import { useServiceTimer } from "../use-service-timer";
import { BlockTimerBar } from "./block-timer-bar";
import { ConsoleTopBar } from "./console-top-bar";
import { LibraryPanel } from "./library-panel";
import { ServicePanel } from "./service-panel";
import { Workspace } from "./workspace";

/**
 * The live console (IRIS_SPEC §6.2), with the desktop layout: BIBLIOTECA | the open item |
 * SERVICIO over EN VIVO. It drives every `/display` open in this browser.
 */
export function LiveConsole({ data }: { data: ConsoleData }) {
  // Drawn in the browser only: it resumes from a copy kept there (`running-backup.ts`), which
  // the server cannot see. The server sends the empty canvas.
  const isBrowser = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  if (!isBrowser) return <div className="fixed inset-0 z-10 bg-canvas" />;
  return <ConsoleRoot data={data} />;
}

const subscribeNever = () => () => {};

function ConsoleRoot({ data }: { data: ConsoleData }) {
  const ctrl = useLiveConsole(data);
  const service = useServiceTimer(data);
  useShortcuts(ctrl);

  return (
    <div className="fixed inset-0 z-10 flex flex-col bg-canvas">
      <ConsoleTopBar
        ctrl={ctrl}
        churchName={data.churchName}
        serviceName={service.serviceType?.name ?? null}
      />
      <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)_340px] gap-4 px-4 pb-4 2xl:grid-cols-[340px_minmax(0,1fr)_380px]">
        <LibraryPanel ctrl={ctrl} library={data.library} />
        <div className="flex min-h-0 flex-col gap-4">
          <BlockTimerBar service={service} people={data.people} />
          <Workspace ctrl={ctrl} />
        </div>
        <ServicePanel ctrl={ctrl} />
      </div>
    </div>
  );
}

/** IRIS_SPEC §12.4: ← → slides, B clears the screen, P plays the song's track, Space plays or pauses. */
function useShortcuts(ctrl: ReturnType<typeof useLiveConsole>) {
  const { step, toggleCleared, togglePlay, toggleTrack } = ctrl;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        step(-1);
      } else if (event.key === "b" || event.key === "B") {
        toggleCleared();
      } else if (event.key === "p" || event.key === "P") {
        toggleTrack();
      } else if (event.key === " ") {
        event.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, toggleCleared, togglePlay, toggleTrack]);
}
