"use client";

import { Tv } from "lucide-react";
import { useState } from "react";
import { IrisWordmark } from "@/components/brand/iris-mark";
import type { UserSession } from "@/domain/models";
import { AccountMenu } from "@/features/shell/account-menu";
import { cn } from "@/lib/cn";
import { BibleButton } from "../bible/bible-button";
import { BackgroundPicker } from "../backgrounds/background-picker";
import { ToolsButton } from "../tools/tools-button";
import type { LiveConsole } from "../use-live-console";
import { DisplaysDialog } from "./displays-dialog";

/** IRIS_SPEC §6.2 top bar: the service and the screens' status. */
export function ConsoleTopBar({
  ctrl,
  churchName,
  session,
  serviceName,
}: {
  ctrl: LiveConsole;
  churchName: string;
  session: UserSession;
  serviceName: string | null;
}) {
  const { displays: screens, activeId } = ctrl.remote;
  const isActiveOnline = screens.some((display) => display.id === activeId && display.online);
  const [isManagingScreens, setIsManagingScreens] = useState(false);

  return (
    <header className="flex h-[68px] shrink-0 items-center gap-4 px-6">
      <IrisWordmark height={24} />
      <span aria-hidden className="h-7 w-px bg-line" />
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold">{serviceName ?? "Servicio"}</p>
        <p className="truncate text-xs text-ink-2">{churchName}</p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <ToolsButton ctrl={ctrl} />
        <BackgroundPicker ctrl={ctrl} />
        <BibleButton ctrl={ctrl} />
        <button
          type="button"
          onClick={() => setIsManagingScreens(true)}
          title={
            screens.length === 0
              ? "Conecta una pantalla para proyectar"
              : isActiveOnline
                ? "La pantalla donde se proyecta está encendida"
                : "La pantalla donde se proyecta está apagada"
          }
          className={cn(
            "flex h-10 cursor-pointer items-center gap-2.5 rounded-full px-4 text-sm font-medium ring-1 transition ring-inset",
            screens.length === 0
              ? "bg-warning/10 text-ink ring-warning/30 hover:bg-warning/16"
              : isActiveOnline
                ? "bg-success/10 text-ink ring-success/30 hover:bg-success/16"
                : "text-ink ring-line hover:bg-surface",
          )}
        >
          <Tv
            aria-hidden
            className={cn(
              "size-4",
              screens.length === 0
                ? "text-warning"
                : isActiveOnline
                  ? "text-success"
                  : "text-ink-2",
            )}
          />
          Pantallas
        </button>
        {isManagingScreens && (
          <DisplaysDialog ctrl={ctrl} onClose={() => setIsManagingScreens(false)} />
        )}
        <AccountMenu session={session} />
      </div>
    </header>
  );
}
