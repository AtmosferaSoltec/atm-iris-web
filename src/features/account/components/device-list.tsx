"use client";

import { Globe, LogOut, Monitor, Tablet } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import type { DeviceSession, Platform } from "@/domain/models";
import { relativeTime } from "@/lib/format";
import { revokeSession, signOutEverywhere } from "../actions";

const PLATFORMS: Record<Platform, { icon: typeof Globe; label: string }> = {
  web: { icon: Globe, label: "Navegador" },
  ios: { icon: Tablet, label: "iPad" },
  windows: { icon: Monitor, label: "Windows" },
};

type Props = { sessions: DeviceSession[]; timeZone: string; now: string };

export function DeviceList({ sessions, timeZone, now }: Props) {
  const [closing, setClosing] = useState<DeviceSession | null>(null);
  const [isClosingAll, setIsClosingAll] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function confirmClose() {
    if (!closing) return;
    startTransition(async () => {
      const result = await revokeSession(closing.id);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setClosing(null);
      toast.success("Sesión cerrada");
    });
  }

  function confirmCloseAll() {
    startTransition(async () => {
      const result = await signOutEverywhere();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <ul className="divide-y divide-line">
        {sessions.map((session) => {
          const { icon: Icon, label } = PLATFORMS[session.platform];
          return (
            <li key={session.id} className="flex flex-wrap items-center gap-4 py-4 first:pt-0">
              <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-surface-raised text-ink-2">
                <Icon aria-hidden className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {session.deviceName ?? label}
                  {session.isCurrent && <Chip color="var(--color-success)">Este dispositivo</Chip>}
                </p>
                <p className="text-sm text-ink-2">
                  {session.deviceName && session.deviceName !== label && `${label} · `}
                  Último uso {relativeTime(session.lastUsedAt, timeZone, new Date(now))}
                  {session.ipAddress && <span className="text-ink-2"> · {session.ipAddress}</span>}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={<LogOut className="size-4" />}
                onClick={() => {
                  setError(undefined);
                  setClosing(session);
                }}
              >
                Cerrar sesión
              </Button>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-line pt-5">
        <Button
          variant="danger"
          onClick={() => {
            setError(undefined);
            setIsClosingAll(true);
          }}
        >
          Cerrar sesión en todos los dispositivos
        </Button>
      </div>

      <ConfirmDialog
        open={closing !== null}
        onClose={() => setClosing(null)}
        onConfirm={confirmClose}
        isPending={isPending}
        error={error}
        title={
          closing?.isCurrent ? "¿Cerrar la sesión de este dispositivo?" : "¿Cerrar esta sesión?"
        }
        description={
          closing?.isCurrent
            ? "Tendrás que volver a iniciar sesión en este navegador."
            : `${closing?.deviceName ?? "Ese dispositivo"} tendrá que volver a iniciar sesión.`
        }
        confirmLabel="Cerrar sesión"
      />
      <ConfirmDialog
        open={isClosingAll}
        onClose={() => setIsClosingAll(false)}
        onConfirm={confirmCloseAll}
        isPending={isPending}
        error={error}
        title="¿Cerrar sesión en todos los dispositivos?"
        description="Se cerrará también aquí. Las consolas tendrán que volver a iniciar sesión."
        confirmLabel="Cerrar todas"
      />
    </div>
  );
}
